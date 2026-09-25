# BayarIvo deployment

GitHub Actions builds Linux ARM64 artifacts and uploads using SERVER_HOST,
SERVER_PORT, SERVER_USER and SERVER_SSH_KEY secrets. Source folders are
pulsa-fe and pulsa-be relative to the checkout, not absolute server paths.

The syslog-ng SSH account has home /var/lib/syslog-ng, which is root-owned.
The server administrator must provision only ~/bayarivo and its frontend and
pulsa-be subdirectories with ownership syslog-ng:syslog-ng and mode 0755.
Do not change ownership of the entire home or shared application directory.

Staging:
- ~/bayarivo/frontend
- ~/bayarivo/pulsa-be/bayarivo-api

Install ops/bayarivo-activate.py as root-owned mode 0755
/usr/local/sbin/bayarivo-activate. Allow syslog-ng to run only this no-argument
command with passwordless sudo. The helper expects the existing bayarivo-fe and
bayarivo-be systemd units and their separate server-owned environment files.
It snapshots both artifacts into deployment/bayarivo/releases, switches only
these two services, and rolls back if local health/version checks fail.
The deployment job also verifies the exact commit through the public domain.

Frontend listens on 172.22.0.1:33030; backend on 127.0.0.1:8104.
Nginx Proxy Manager routes bayarivo.com to the frontend. Production environment
files stay under /var/lib/syslog-ng/fadlanpulsa/deployment/bayarivo; never upload
or commit them. Do not point another application's deployment at these paths.

Push main triggers deployment. Directory values are fixed in the workflow;
legacy directory secrets are unused. Credentials remain in server env files.
