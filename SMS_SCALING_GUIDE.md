# SMS Queue Scalability Guide

## Current Capacity & Bottlenecks

### Current Configuration
- **Batch Size**: 50 messages per run (configurable via `SMS_BATCH_SIZE`)
- **Frequency**: Every 5 minutes (`*/5 * * * *`)
- **Hourly Capacity**: 50 × 12 runs = 600 SMS/hour
- **Daily Capacity**: 600 × 24 = 14,400 SMS/day

### Growth Scenarios & Capacity Planning

| Users | Daily Requests | Current Status | Action Required |
|-------|---------------|----------------|-----------------|
| 50    | 125           | ✅ Good       | None            |
| 200   | 500           | ✅ Good       | None            |
| 500   | 1,250         | ✅ Good       | Monitor         |
| 1,000 | 2,500         | ⚠️ Watch     | Monitor closely |
| 2,000 | 5,000         | 🔴 Risk      | Scale up        |
| 5,000 | 12,500        | 🔴 Critical  | Immediate action|

## Monitoring & Alerts

### Queue Health Endpoints
- **Real-time queue status**: `/api/admin/sms-queue-health`
- **Overall system health**: `/api/admin/health-status` (includes queue depth)

### Alert Thresholds
- **Warning**: Queue depth > 3× batch size (150+ pending with default)
- **Critical**: Queue depth > 6× batch size (300+ pending with default)

### Log Monitoring
```bash
# Look for these warning signs in logs:
grep "SMS QUEUE WARNING" logs
grep "SMS QUEUE CRITICAL" logs
grep "Queue depth:" logs
```

## Scaling Options

### Option 1: Increase Batch Size (Recommended First Step)
```bash
# Set environment variable in Vercel dashboard:
SMS_BATCH_SIZE=100   # Doubles capacity to 1,200 SMS/hour
SMS_BATCH_SIZE=200   # 4x capacity to 2,400 SMS/hour
```

**Pros**:
- Simple configuration change
- No code deployment needed
- Maintains 5-minute processing intervals

**Cons**:
- May hit Vercel function timeout limits (10 minutes max)
- Larger batches = longer processing time per run

### Option 2: Increase Frequency
```json
// In vercel.json, change schedule from "*/5 * * * *" to:
"*/2 * * * *"  // Every 2 minutes = 30 runs/hour = 1,500 SMS/hour
"*/1 * * * *"  // Every 1 minute = 60 runs/hour = 3,000 SMS/hour
```

**Pros**:
- Faster processing of backlog
- Smaller batches = less function timeout risk

**Cons**:
- More frequent function invocations
- Higher infrastructure costs

### Option 3: Hybrid Approach (Best for High Scale)
```bash
# Combine both approaches:
SMS_BATCH_SIZE=100
# Plus schedule: "*/2 * * * *"
# Result: 100 × 30 runs = 3,000 SMS/hour
```

## Implementation Steps

### 1. Monitor Current Usage
1. Check queue depth: `GET /api/admin/sms-queue-health`
2. Monitor for 1-2 weeks to understand patterns
3. Look for queue backup during peak times

### 2. Scale Gradually
Start with batch size increase:
1. Set `SMS_BATCH_SIZE=75` (50% increase)
2. Monitor for 48 hours
3. Check function execution time and timeout issues
4. If stable, increase to 100, then 150

### 3. Frequency Adjustment (If Needed)
If batch size alone isn't sufficient:
1. Change vercel.json schedule to "*/3 * * * *" (every 3 minutes)
2. Deploy and monitor
3. Further reduce to "*/2 * * * *" if needed

### 4. Emergency Scaling
If queue backup is critical (>6x batch size):
1. **Immediate**: Set `SMS_BATCH_SIZE=200`
2. **Deploy**: Change schedule to "*/2 * * * *"`
3. **Monitor**: Queue should clear within 1-2 hours

## Queue Health Monitoring

### Key Metrics to Watch
```javascript
// From /api/admin/sms-queue-health response:
{
  "queueHealth": "good|warning|critical",
  "queue": {
    "pending": 245,     // Ready to send now
    "queued": 12,       // Rate limited
    "scheduled": 1840   // Future scheduled
  },
  "processing": {
    "hoursToProcessPending": 2.1,
    "hoursUntilOverload": 0.8
  }
}
```

### Automated Monitoring
```bash
# Add to monitoring system:
curl https://yourapp.com/api/admin/sms-queue-health \
  | jq '.queueHealth' \
  | grep -q "critical" && alert "SMS queue critical"
```

## Performance Considerations

### Function Timeout Limits
- Vercel limit: 10 minutes for Pro plan
- Estimated processing time: ~2-3 seconds per SMS
- Safe batch size limit: ~200 messages

### Rate Limiting
- Twilio limits apply per account
- Per-user rate limiting implemented
- Platform-wide limits will stop processing

### Database Performance
- Current queries are optimized with indexes
- Large batch sizes may need query optimization
- Monitor query execution time

## Maintenance

### Regular Health Checks
- Weekly queue depth review
- Monitor failure rates
- Check processing times

### Capacity Planning
- Review growth monthly
- Adjust batch size before hitting limits
- Plan frequency changes during low-traffic periods

### Emergency Procedures
1. **Queue Critical**: Immediate batch size increase
2. **Function Timeouts**: Reduce batch size, increase frequency
3. **Rate Limits Hit**: Check Twilio account limits
4. **Database Slow**: Review query performance

## Environment Variables

```bash
# Core scaling configuration:
SMS_BATCH_SIZE=50           # Messages per batch (default: 50)

# Monitoring (informational):
NEXT_PUBLIC_APP_URL=...     # For SMS links
TWILIO_ACCOUNT_SID=...      # Twilio config
TWILIO_AUTH_TOKEN=...       # Twilio config
```

## Contact & Escalation

When queue health is critical:
1. Increase `SMS_BATCH_SIZE` immediately
2. Monitor `/api/admin/sms-queue-health` every 15 minutes
3. Consider frequency increase if batch size isn't sufficient
4. Review Twilio account limits if rate limiting occurs

The system is designed to scale smoothly with configuration changes rather than code deployments for rapid response to growth.