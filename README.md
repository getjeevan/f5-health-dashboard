# F5 VIP & Pool Health Dashboard

A real-time monitoring dashboard for F5 BIG-IP Virtual Servers (VIPs), Pools, and Pool Members. Built to help NOC engineers quickly identify single points of failure and critical availability issues.

## Features

- **Real-time Monitoring**: Polls F5 BIG-IP devices and displays VIP/Pool/Member health status
- **Risk Detection**: Automatically flags VIPs with:
  - **Critical**: 0 active members (service down)
  - **High Risk**: 1 active member (single point of failure)
  - **Warning**: 2 active members
  - **Healthy**: 3+ active members
- **VIP Drill-Down**: Click any VIP to see detailed pool member status
- **Search & Filter**: Quickly find VIPs by name, IP, pool, or risk level
- **NOC-Optimized UI**: Dark theme designed for 24/7 monitoring

## Architecture

- **Frontend**: React + TanStack Query + Tailwind CSS
- **Backend**: Node.js + Express
- **F5 Integration**: iControl REST API
- **Data**: In-memory caching with configurable polling intervals

## Setup

### Prerequisites

- Node.js 20+
- Access to an F5 BIG-IP device with iControl REST API enabled
- F5 credentials with read-only access (recommended)

### Installation

```bash
npm install
```

### Configuration

Configure F5 connection via environment variables:

```bash
# Required
export F5_HOST=10.1.1.5
export F5_USERNAME=readonly-user
export F5_PASSWORD=your-secure-password

# Optional (with defaults shown)
export F5_PORT=443
export F5_VERIFY_TLS=true
export F5_PARTITION=Common
export F5_POLLING_INTERVAL=10  # seconds
```

Alternatively, configure via the Settings page in the UI after starting the application.

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### Production Build

```bash
npm run build
npm start
```

## Docker Deployment

### Build Image

```bash
docker build -t f5-health-dashboard .
```

### Run Container

```bash
docker run -d \
  -p 5000:5000 \
  -e F5_HOST=10.1.1.5 \
  -e F5_USERNAME=readonly \
  -e F5_PASSWORD=secret \
  --name f5-dashboard \
  f5-health-dashboard
```

### Docker Compose

```yaml
version: '3.8'
services:
  f5-dashboard:
    build: .
    ports:
      - "5000:5000"
    environment:
      - F5_HOST=10.1.1.5
      - F5_USERNAME=readonly
      - F5_PASSWORD=secret
      - F5_PORT=443
      - F5_VERIFY_TLS=true
      - F5_PARTITION=Common
      - F5_POLLING_INTERVAL=10
    restart: unless-stopped
```

## RHEL/OpenShift Deployment

The Dockerfile includes commented instructions for using Red Hat UBI (Universal Base Image):

```dockerfile
# FROM registry.access.redhat.com/ubi9/nodejs-20
```

Uncomment this line and comment out the `node:20-alpine` line for RHEL compliance.

## API Endpoints

- `GET /api/vips` - List all VIPs with risk levels
- `GET /api/vips/:id` - Get detailed VIP information including pool members
- `GET /api/status` - Get polling service status
- `GET /api/settings` - Get F5 connection settings (password excluded)
- `POST /api/settings` - Update F5 connection settings
- `GET /api/alerts` - Get alert rules
- `POST /api/alerts` - Create alert rule
- `PATCH /api/alerts/:id` - Update alert rule
- `DELETE /api/alerts/:id` - Delete alert rule

## Security Considerations

1. **Read-Only Access**: Create a dedicated F5 user with read-only permissions
2. **TLS Verification**: Enable `F5_VERIFY_TLS=true` in production
3. **Credentials**: Never commit credentials to version control
4. **Network**: Deploy behind a reverse proxy (nginx, Apache) in production
5. **RBAC**: Add authentication/authorization for multi-user deployments (Phase 2)

## Troubleshooting

### No VIPs Showing

1. Check F5 settings are configured (Settings page or environment variables)
2. Verify F5 device is reachable: `curl https://F5_HOST:443`
3. Check credentials are correct
4. Review logs in the console for polling errors
5. Verify partition name matches your F5 configuration

### Polling Errors

Check the server logs for detailed error messages:
```bash
# Development
npm run dev

# Production
journalctl -u f5-dashboard -f
```

### TLS Certificate Issues

If using self-signed certificates, temporarily disable TLS verification:
```bash
export F5_VERIFY_TLS=false
```

**Note**: Only use this in development/testing environments.

## Roadmap

### Phase 2 Features
- [ ] Multi-F5 device support
- [ ] Historical trending and analytics
- [ ] Alert notifications (Email, Slack, MS Teams, ServiceNow)
- [ ] SSO/SAML authentication
- [ ] RBAC (Role-Based Access Control)
- [ ] Prometheus metrics exporter
- [ ] Custom dashboards per service owner

## License

MIT

## Support

For issues and questions, please refer to the PRD documentation or contact your platform administrator.
