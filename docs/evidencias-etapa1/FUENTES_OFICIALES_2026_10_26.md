# Extractos de fuentes oficiales — consulta 26/10/2026

Estas citas breves respaldan cuotas y límites del plan. SHA/bytes de la respuesta original constan en el JSON; los extractos de HTML son texto normalizado y tienen otro hash. Una respuesta HTTP 200 no acredita que la página trate el tema: el supuesto documento de pausas Appwrite fue un índice genérico y NO se usa como evidencia. No se creó ninguna cuenta ni servicio.

## supabase-changelog

https://supabase.com/changelog.md

> ## An outdated subset of TLS 1.2 ciphers will be disabled on project HTTP APIs
> 2026-10-12 · Breaking Change · Auth, Data APIs, Storage, Realtime, Edge Functions · [supabase.com/changelog/cbc-tls-ciphers-deprecated](https://supabase.com/changelog/cbc-tls-ciphers-deprecated)
> Supabase will be disabling a subset of TLS 1.2 ciphers on project HTTP APIs on November 10, 2026. Clients that don't support modern standards (<0.0001% of Supabase traffic) will fail to connect.
> ltree and btree_gist indexes may need reindexing, and pgcrypto data encrypted with legacy ciphers needs re-encryption.

## supabase-pricing

https://supabase.com/pricing

> Start building for free, collaborate with your team, then scale to millions of users
> Free
> Start for Free
> 50,000 monthly active users
> 500 MB database size
> Shared CPU • 500 MB RAM
> 5 GB egress
> 5 GB cached egress
> 1 GB file storage
> Free projects are paused after 1 week of inactivity. Limit of 2 active projects.
> Everything in the Free Plan, plus:
> 200
> First instance is free on paid plans
> free
> After 1 week of inactivity
> 50,000 included
> Content Delivery Network
> 200 included

## supabase-backups

https://supabase.com/docs/guides/platform/backups.md

> # Database Backups
> Learn about backups for your Supabase project.
> We automatically back up all Pro, Team, and Enterprise Plan projects on a daily basis. You can find backups in the [**Database** > **Backups**](https://supabase.com/dashboard/project/_/database/backups/scheduled) section of the Dashboard.
> Pro Plan projects can access the last 7 days of daily backups. Team Plan projects can access the last 14 days of daily backups, while Enterprise Plan projects can access up to 30 days of daily backups. If you need more frequent backups, consider enabling [Point-in-Time Recovery](#point-in-time-recovery). We recommend that free tier plan projects regularly export their data using the [Supabase CLI `db dump` command](https://supabase.com/docs/reference/cli/supabase-db-dump) and maintain off-site backups.
> Caution: When you delete a project, we permanently remove all associated data, including any backups stored in S3. This action is irreversible, so consider it carefully before proceeding.
> ## Types of backups
> Database backups can be categorized into two types: **logical** and **physical**. You can learn more about them [in this blog post](https://supabase.com/blog/postgresql-physical-logical-backups).
> Note: All projects on Postgres `15.8.1.079` and newer use the newer physical backup process.
> Projects on older Postgres versions have to upgrade in order to be transitioned to physical backups. Once upgraded to an eligible version, your project is automatically transitioned over to physical backups.
> Caution: For security purposes, daily backups do not store passwords for custom roles, and you will not find them in downloadable files. If you restore from a daily backup and use custom roles, you will need to reset their passwords after the restoration completes.
> Note: Database backups do not include objects you store via the Storage API, as the database only includes metadata about these objects. Restoring an old backup does not restore objects you deleted after that backup.
> ## Backup and restore process
> You can access daily backups in the [**Database** > **Backups**](https://supabase.com/dashboard/project/_/database/backups/scheduled) section of the Dashboard and restore a project to any of the backups.
> You can restore your project to any of the backups. To generate a logical backup yourself, use the [Supabase CLI `db dump` command](https://supabase.com/docs/reference/cli/supabase-db-dump).
> ## Managing backups programmatically
> You can also manage backups programmatically [using the Management API](https://supabase.com/docs/reference/api/v1-list-all-backups):
> # List all available backups
> "https://api.supabase.com/v1/projects/$PROJECT_REF/database/backups"

## supabase-smtp

https://supabase.com/docs/guides/auth/auth-smtp.md

> # Send emails with custom SMTP
> Moving towards production: Configuring a custom SMTP provider
> You will need to set up a custom SMTP server to handle the delivery of messages to your users.
> To get you started and let you explore and set up email message templates for your application, Supabase provides an SMTP server for all projects. This server imposes a few important restrictions and is not meant for production use.
> Unless you configure a custom SMTP server for your project, Supabase Auth will refuse to deliver messages to addresses that are not part of the project's team. You can manage this in the [Team tab](https://supabase.com/dashboard/org/_/team) of the organization's settings.
> To maintain the health and reputation of the default SMTP sending service, the number of messages your project can send is limited and can change without notice. Currently this value is set to 2 messages per hour.
> The default SMTP service is provided as best-effort only and intended for the following non-production use cases:
> - Setting up and testing email templates with the members of the project's team
> We urge all customers to set up custom SMTP server for all other use cases.
> ## How to set up a custom SMTP server?
> Once you've set up your account with an email sending service, head to the [Authentication settings page](https://supabase.com/dashboard/project/_/auth/smtp) to enable and configure custom SMTP.
> You can also configure custom SMTP using the Management API:
> # Configure custom SMTP

## supabase-function-limits

https://supabase.com/docs/guides/functions/limits.md

> - Maximum Memory: 256MB
> - Free plan: 150s
> - Maximum CPU Time: 2s (Amount of actual time spent on the CPU per request - does not include async I/O.)
> - Request idle timeout: 150s (If an Edge Function doesn't send a response before the timeout, 504 Gateway Timeout will be returned)
> - Maximum Function Size: 20MB (bundled locally via the CLI) or 5MB (bundled server-side, e.g. via the Management API or Dashboard)
> - Free: 100

## appwrite-pricing

https://appwrite.io/pricing

> What happens if I reach a resource limit in my Free plan?
> Your project will freeze, and Appwrite Console will continue running in read-only mode. You need to upgrade to Pro, remove resources that exceed their limit, or wait for the next billing cycle, which resets usage limits.
> I have a Free plan account. How do I upgrade to a paid plan?
> Go to the Appwrite Console and select the organization you wish to add credits to. In your organization overview, you can switch to the billing tab. Here, you need to go to the bottom of the page, where you will find the ability to add credits, as well as see the status of your credits. Credits are only relevant to Pro organizations since Free organizations are 100% free.

## appwrite-transactions

https://appwrite.io/docs/products/databases/transactions

> Stage multiple database operations and commit them atomically. Group changes across databases and tables with ordering, isolation, and conflict detection.
> On commit, Appwrite replays all staged logs in order inside a real database transaction. Staged operations see earlier staged changes (read your own writes). If any affected row changed outside your transaction, the commit fails with a conflict.
> Free
> 100
> 1000
> Handle conflicts
> On commit, Appwrite verifies that rows affected by your transaction haven’t changed externally since they were staged. If a conflicting change is detected, the commit fails with a conflict error. Resolve the conflict (for example, refetch and re-stage) and try again.
> Keep transactions short-lived to reduce the likelihood of conflicts. Stage related updates in the order they must be applied. Prefer

## supabase-free-policy

https://supabase.com/docs/guides/platform/billing-on-supabase.md

> The Free Plan helps you get started and explore the platform. You are granted two free projects. The project limit applies across all organizations where you are an Owner or Administrator. This means you could have two Free Plan organizations with one project each, or one Free Plan organization with two projects. Paused projects do not count towards your free project limit.
> The quota is applied to your entire organization, independent of how many projects you launch within that organization. For billing purposes, we sum the usage across all projects in a monthly invoice.
> | Egress                           | 5 GB                     | 250 GB included, then $0.09 per GB                 | Custom     |
> | Database Size                    | 500 MB per project       | 8 GB disk per project included, then $0.125 per GB | Custom     |
> | Monthly Active Users             | 50,000 MAU               | 100,000 MAU included, then $0.00325 per MAU        | Custom     |
> | Storage Size                     | 1 GB                     | 100 GB included, then $0.021 per GB                | Custom     |
> | Edge Function Invocations        | 500,000                  | 2 million included, then $2 per million            | Custom     |
> | Realtime Message Count           | 2 million                | 5 million included, then $2.5 per million          | Custom     |
> | Realtime Peak Connections        | 200                      | 500 included, then $10 per 1000                    | Custom     |
