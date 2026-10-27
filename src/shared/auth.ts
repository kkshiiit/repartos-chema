/** Real Supabase Auth transport. Roles are supplied by memberships, never user_metadata. */
export interface SharedSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
  email: string;
}
export interface SessionStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem?(key: string): Promise<void>;
}
export class SharedSessionVault {
  private tail: Promise<unknown> = Promise.resolve();
  constructor(
    private storage: SessionStorage,
    private prefix = 'chema_shared_session_v1',
  ) {}
  async read(): Promise<SharedSession | null> {
    const raw = await this.storage.getItem(this.prefix);
    if (raw === null) return null;
    try {
      const header = JSON.parse(raw) as {
        version: number;
        generation: string;
        parts: number;
        signedOut?: boolean;
      };
      if (header.version === 1 && header.signedOut === true) return null;
      if (
        header.version !== 1 ||
        !/^g_[A-Za-z0-9_]+$/.test(header.generation) ||
        !Number.isInteger(header.parts) ||
        header.parts < 1 ||
        header.parts > 100
      )
        throw new Error('HEADER');
      const chunks = await Promise.all(
        Array.from({ length: header.parts }, (_, i) =>
          this.storage.getItem(`${this.prefix}_${header.generation}_${i}`),
        ),
      );
      if (chunks.some((v) => v === null)) throw new Error('CHUNK');
      const session = JSON.parse(chunks.join('')) as SharedSession;
      if (
        typeof session.accessToken !== 'string' ||
        typeof session.refreshToken !== 'string' ||
        typeof session.userId !== 'string' ||
        typeof session.email !== 'string' ||
        !Number.isFinite(session.expiresAt)
      )
        throw new Error('SESSION');
      return session;
    } catch {
      throw new Error(
        'No pudimos recuperar la sesión del equipo. Se conservaron los datos y la cola local.',
      );
    }
  }
  save(session: SharedSession | null): Promise<void> {
    const write = async () => {
      const oldRaw = await this.storage.getItem(this.prefix);
      let old: { generation: string; parts: number } | null = null;
      try {
        const header = oldRaw ? JSON.parse(oldRaw) : null;
        if (
          header?.version === 1 &&
          /^g_[A-Za-z0-9_]+$/.test(header.generation) &&
          Number.isInteger(header.parts) &&
          header.parts > 0 &&
          header.parts <= 100
        )
          old = header;
      } catch {
        /* preserve corrupt old generation; don't guess what to erase */
      }
      if (session === null) {
        if (this.storage.removeItem) await this.storage.removeItem(this.prefix);
        else
          await this.storage.setItem(this.prefix, JSON.stringify({ version: 1, signedOut: true }));
      } else {
        const text = JSON.stringify(session),
          generation = `g_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const chunks = text.match(/[\s\S]{1,1000}/g) || [];
        for (let i = 0; i < chunks.length; i++) {
          const key = `${this.prefix}_${generation}_${i}`;
          await this.storage.setItem(key, chunks[i]!);
          if ((await this.storage.getItem(key)) !== chunks[i])
            throw new Error('No se pudo verificar la nueva sesión. Se conserva la anterior.');
        }
        const header = JSON.stringify({ version: 1, generation, parts: chunks.length });
        // Pointer is the only commit: incomplete chunks never invalidate the old session.
        await this.storage.setItem(this.prefix, header);
        if ((await this.storage.getItem(this.prefix)) !== header)
          throw new Error('No se pudo verificar el cierre de la sesión.');
      }
      // Only after publishing the new pointer/sign-out may old encrypted chunks be removed.
      if (old && this.storage.removeItem)
        for (let i = 0; i < old.parts; i++)
          await this.storage
            .removeItem(`${this.prefix}_${old.generation}_${i}`)
            .catch(() => undefined);
    };
    const task = this.tail.then(write, write);
    this.tail = task.catch(() => undefined);
    return task;
  }
}
export class SharedSessionChangedError extends Error {
  readonly status = 401;
  readonly code = 'SESSION_CHANGED';
  constructor() {
    super('La sesión o la cuenta cambió. Conservamos la cola anterior sin enviarla.');
  }
}
export class SharedAuth {
  private session: SharedSession | null = null;
  private loaded = false;
  private signedOut = false;
  private generation = 0;
  private refreshFlight?: { generation: number; userId: string; promise: Promise<string> };
  constructor(
    private config: { url: string; publicKey: string },
    private vault: SharedSessionVault,
  ) {}
  private assertGeneration(generation: number, expectedUserId?: string) {
    if (
      generation !== this.generation ||
      (expectedUserId && this.session && this.session.userId !== expectedUserId)
    )
      throw new SharedSessionChangedError();
  }
  private async request(path: string, body?: unknown, token?: string) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(this.config.url + path, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          apikey: this.config.publicKey,
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const data = response.status === 204 ? null : await response.json();
      return { response, data };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError')
        throw new Error(
          'Se agotó el tiempo de conexión. Reintentá; los cambios pendientes se conservan.',
        );
      throw new Error(
        'No pudimos conectar con el equipo. Reintentá con conexión; los datos se conservan.',
      );
    } finally {
      clearTimeout(timer);
    }
  }
  async load() {
    if (this.signedOut) return null;
    const generation = this.generation;
    const value = await this.vault.read();
    this.assertGeneration(generation);
    if (this.signedOut) return null;
    this.session = value;
    this.loaded = true;
    return value;
  }
  private async accept(value: unknown, generation: number, expectedUserId?: string) {
    this.assertGeneration(generation);
    const data = value as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      user?: { id?: string; email?: string };
    };
    if (
      !data?.access_token ||
      !data.refresh_token ||
      !data.user?.id ||
      !Number.isFinite(data.expires_in)
    )
      throw new Error('No pudimos validar la sesión del equipo.');
    if (expectedUserId && data.user.id !== expectedUserId) throw new SharedSessionChangedError();
    const session: SharedSession = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + Number(data.expires_in) * 1000,
      userId: data.user.id,
      email: data.user.email || '',
    };
    // The vault serializes publication. A later logout/new sign-in is queued after this write.
    await this.vault.save(session);
    this.assertGeneration(generation);
    this.session = session;
    this.loaded = true;
    this.signedOut = false;
    return session;
  }
  private async beginAuthentication() {
    const generation = ++this.generation;
    this.signedOut = true;
    this.session = null;
    this.loaded = true;
    this.refreshFlight = undefined;
    await this.vault.save(null);
    this.assertGeneration(generation);
    return generation;
  }
  async signIn(email: string, password: string) {
    if (!email.trim() || !password) throw new Error('Completá correo y contraseña.');
    const generation = await this.beginAuthentication();
    const { response, data } = await this.request('/auth/v1/token?grant_type=password', {
      email: email.trim(),
      password,
    });
    this.assertGeneration(generation);
    if (!response.ok)
      throw new Error(
        'No pudimos iniciar sesión. Revisá correo y contraseña o la invitación del responsable.',
      );
    return this.accept(data, generation);
  }
  async accessToken(expectedUserId?: string): Promise<string> {
    if (this.signedOut) throw new SharedSessionChangedError();
    if (!this.loaded) await this.load();
    if (!this.session) throw new SharedSessionChangedError();
    const generation = this.generation,
      session = this.session;
    this.assertGeneration(generation, expectedUserId);
    if (session.expiresAt > Date.now() + 60000) return session.accessToken;
    if (
      !this.refreshFlight ||
      this.refreshFlight.generation !== generation ||
      this.refreshFlight.userId !== session.userId
    ) {
      const flight = { generation, userId: session.userId, promise: Promise.resolve('') };
      flight.promise = (async () => {
        const { response, data } = await this.request('/auth/v1/token?grant_type=refresh_token', {
          refresh_token: session.refreshToken,
        });
        this.assertGeneration(generation, session.userId);
        if (response.status === 401 || response.status === 403)
          throw new SharedSessionChangedError();
        if (!response.ok)
          throw new Error(
            'La sesión venció. Volvé a ingresar; tus cambios pendientes siguen guardados.',
          );
        return (await this.accept(data, generation, session.userId)).accessToken;
      })().finally(() => {
        if (this.refreshFlight === flight) this.refreshFlight = undefined;
      });
      this.refreshFlight = flight;
    }
    const token = await this.refreshFlight.promise;
    this.assertGeneration(generation, expectedUserId);
    return token;
  }
  async signOut() {
    const previous = this.session;
    await this.beginAuthentication(); // Invalidate in-flight refresh before any network wait.
    if (previous) {
      try {
        await this.request('/auth/v1/logout?scope=local', undefined, previous.accessToken);
      } catch {
        /* Local session is already closed; no business data is deleted. */
      }
    }
  }
  async enroll(token: string, nombre: string, email: string, password: string) {
    if (token.trim().length < 32 || !nombre.trim() || !email.trim() || password.length < 12)
      throw new Error(
        'Completá invitación, nombre, correo y una contraseña de al menos 12 caracteres.',
      );
    const generation = await this.beginAuthentication();
    const { response, data } = await this.request('/functions/v1/chema-api', {
      type: 'enroll',
      token: token.trim(),
      nombre: nombre.trim(),
      email: email.trim(),
      password,
    });
    this.assertGeneration(generation);
    if (!response.ok)
      throw new Error(
        data?.error || 'No pudimos usar la invitación. Consultá al responsable del equipo.',
      );
    if (typeof data?.spaceId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(data.spaceId))
      throw new Error('No pudimos validar el equipo de la invitación.');
    const session = await this.accept(data.session, generation);
    return { session, spaceId: data.spaceId as string };
  }
}
