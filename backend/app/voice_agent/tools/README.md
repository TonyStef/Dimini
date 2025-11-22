# Hume AI Tool Definitions - Copy & Paste Guide

Exact format for Hume AI Platform UI (ca la CasiusAI).

---

## Instructions

1. Go to: **Hume AI Platform → Config → Tools tab**
2. Click: **"+ Add"** button
3. For each tool:
   - **Name field:** Copy name (lowercase, underscores)
   - **Description field:** Copy description
   - **Parameters field:** Copy ENTIRE JSON from `.json` file

---

## Tool 1: save_session_note

### Name (enter in "Name" field):
```
save_session_note
```

### Description (enter in "Description" field):
```
Call immediately when noting patient insight, therapist observation, concern, or progress during session
```

### Parameters (copy ENTIRE content from `save_session_note.json`):
```json

```

---

## Tool 2: mark_progress

### Name (enter in "Name" field):
```
mark_progress
```

### Description (enter in "Description" field):
```
Call immediately when patient shows breakthrough, emotional regulation, behavioral change, or gains insight
```

### Parameters (copy ENTIRE content from `mark_progress.json`):
```json

```

---

## Tool 3: flag_concern

### Name (enter in "Name" field):
```
flag_concern
```

### Description (enter in "Description" field):
```
Call immediately when detecting emotional distress, risk behavior, deterioration, or crisis indicators requiring therapist attention
```

### Parameters (copy ENTIRE content from `flag_concern.json`):

```

---

## Tool 4: generate_session_summary

### Name (enter in "Name" field):
```
generate_session_summary
```

### Description (enter in "Description" field):
```
Generate structured summary of therapy session including emotions, topics, and recommendations
```

### Parameters (copy ENTIRE content from `generate_session_summary.json`):
```json

```

---

## After Adding All 4 Tools

### Configure Webhooks

1. Go to: **Config → Webhooks tab**
2. Click: **"+ Add"**
3. **Webhook URL:**
   ```
   https://your-domain.com/api/webhooks/hume/tool_call
   ```
4. **Subscribe to events:**
   - ✅ `tool_call`
   - ✅ `chat_started` (optional)
   - ✅ `chat_ended` (optional)

### Set Voice

**Voice:** "Casual Podcast Host" (ITO)

### Get CONFIG_ID

1. Save configuration
2. Copy **CONFIG_ID** from URL or config details
3. Add to `.env`:
   ```env
   HUME_CONFIG_ID=your_config_id_here
   ```

### Save Tool IDs

After adding each tool, copy its **Tool ID** to `.env` (see `.env.example` for format)

---

## Verification Checklist

- [ ] All 4 tools added with exact names (lowercase, underscores)
- [ ] All descriptions entered separately in Description field
- [ ] All parameter JSON schemas copied (validate with no errors)
- [ ] Webhook URL configured
- [ ] tool_call event subscribed
- [ ] Voice set to "Casual Podcast Host"
- [ ] CONFIG_ID saved to .env

---

**Format identic cu CasiusAI update_lead_info!** ✅
