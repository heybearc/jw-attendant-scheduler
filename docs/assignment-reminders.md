# Assignment Reminders System

**Phase 4C Feature #1: Automated Assignment Reminders**

## Overview

Automated system to send reminder emails to volunteers before their assigned events.

---

## How It Works

1. **Cron job runs hourly** on both BLUE and GREEN servers
2. **Checks for upcoming events** in configured reminder windows (24h, 48h, 1 week)
3. **Sends reminder emails** to volunteers with assignments
4. **One email per volunteer** (consolidates all assignments for that event)
5. **Respects notification settings** (can be disabled in admin panel)

---

## Setup Instructions

### 1. Set API Key

Add to `.env.production.local` on both servers:

```bash
CRON_API_KEY=your-secure-random-key-here
```

Generate a secure key:
```bash
openssl rand -hex 32
```

### 2. Make Script Executable

```bash
chmod +x /opt/theoshift/scripts/send-assignment-reminders.sh
```

### 3. Add to Crontab

Run every hour:
```bash
crontab -e
```

Add this line:
```
0 * * * * /opt/theoshift/scripts/send-assignment-reminders.sh
```

Or run every 30 minutes for more precision:
```
*/30 * * * * /opt/theoshift/scripts/send-assignment-reminders.sh
```

### 4. Create Server Role File

On BLUE server:
```bash
echo "blue" > /opt/theoshift/.server-role
```

On GREEN server:
```bash
echo "green" > /opt/theoshift/.server-role
```

### 5. Create Log Directory

```bash
mkdir -p /var/log/theoshift
chown -R theoshift:theoshift /var/log/theoshift
```

---

## Configuration

### Admin Panel Settings

Navigate to: `/admin/notification-settings`

**Options:**
- **Enable/Disable Reminders** - Master toggle
- **Reminder Timing** - Choose when to send:
  - 24 hours before event
  - 48 hours before event
  - 1 week before event

### Environment Variables

**Required:**
- `CRON_API_KEY` - API key for cron authentication
- `NEXTAUTH_URL` - Base URL for API calls
- SMTP settings (for email sending)

---

## Testing

### Manual Test

Call the API directly:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  http://localhost:3000/api/assignments/send-reminders
```

### Check Logs

```bash
tail -f /var/log/theoshift/reminders.log
```

### Test Cron Job

```bash
/opt/theoshift/scripts/send-assignment-reminders.sh
```

---

## How Reminders Are Sent

### Reminder Windows

The system checks for events starting in these windows:

- **24 hours**: Events starting between 24-25 hours from now
- **48 hours**: Events starting between 48-49 hours from now
- **1 week**: Events starting between 168-169 hours from now

### Email Content

Reminder emails include:
- Event name and date
- All volunteer's assignments for that event
- Position names and shifts
- Event location and time
- "This is a reminder" notice

### Deduplication

- One email per volunteer per event
- Consolidates all assignments into single email
- Won't send duplicate reminders in same hour

---

## Troubleshooting

### Reminders Not Sending

1. **Check cron is running:**
   ```bash
   systemctl status cron
   ```

2. **Check logs:**
   ```bash
   tail -f /var/log/theoshift/reminders.log
   ```

3. **Verify API key:**
   ```bash
   grep CRON_API_KEY /opt/theoshift/.env.production.local
   ```

4. **Test manually:**
   ```bash
   /opt/theoshift/scripts/send-assignment-reminders.sh
   ```

5. **Check notification settings:**
   - Visit `/admin/notification-settings`
   - Ensure reminders are enabled
   - Check SMTP configuration

### Permission Issues

```bash
chmod +x /opt/theoshift/scripts/send-assignment-reminders.sh
chown theoshift:theoshift /opt/theoshift/scripts/send-assignment-reminders.sh
mkdir -p /var/log/theoshift
chown -R theoshift:theoshift /var/log/theoshift
```

---

## Architecture

### Components

1. **API Endpoint**: `/api/assignments/send-reminders`
   - Checks settings
   - Finds upcoming events
   - Sends reminder emails
   - Returns success/failure stats

2. **Cron Script**: `scripts/send-assignment-reminders.sh`
   - Loads environment
   - Calls API with authentication
   - Logs results

3. **Notification Settings**: `/admin/notification-settings`
   - Enable/disable reminders
   - Configure timing
   - Check email status

### Security

- API key authentication required
- Only POST method allowed
- Server-side validation
- Rate limiting via cron schedule

---

## Monitoring

### Success Metrics

Check logs for:
- Number of reminders sent
- Number of failures
- Events processed
- Volunteers notified

### Log Format

```
2026-01-29 15:00:00 - Sending assignment reminders...
{"success":true,"message":"Sent 15 reminder(s)","sent":15,"failed":0}
2026-01-29 15:00:00 - ✅ Successfully sent 15 reminder(s)
```

---

## Future Enhancements

- [ ] Add reminder history tracking
- [ ] Support custom reminder messages
- [ ] Add volunteer reminder preferences
- [ ] Implement reminder acknowledgment
- [ ] Add SMS reminder option
- [ ] Dashboard for reminder statistics
