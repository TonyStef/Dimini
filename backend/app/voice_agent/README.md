# Voice Agent Module

Hume AI EVI integration for therapy sessions, reusing **85-90% code** from CasiusAI Brian Agent.

## Structure

```
voice_agent/
├── services/           # Voice agent business logic
│   ├── hume_service.py        # Hume AI WebSocket integration (90% reuse)
│   ├── patient_service.py     # Patient context fetching (85% reuse)
│   └── session_service.py     # Session lifecycle management
├── config/             # Deployment configuration
│   └── deploy_therapist_agent.py  # Hume config deployment script
└── prompts/            # Therapy-specific prompts
    ├── therapy_templates.py       # Context injection templates
    └── therapist_system_prompt.md # System prompt for Hume EVI
```

## Services

### HumeService
**Reuse: 90% from Brian Agent**

Handles Hume AI EVI connection and message routing:
- OAuth2 authentication
- WebSocket connection management
- Context injection
- Tool call handling
- Real-time audio streaming coordination

```python
from app.voice_agent import HumeService

hume = HumeService(
    api_key=settings.HUME_API_KEY,
    secret_key=settings.HUME_SECRET_KEY,
    config_id=settings.HUME_CONFIG_ID
)

# Connect to Hume AI
await hume.connect()

# Send patient context
await hume.inject_context(patient_history)
```

### PatientService
**Reuse: 85% from Brian Agent PropertyService**

Fetches and formats patient data for context injection:
- Patient history retrieval
- Previous session summaries
- Knowledge graph context
- Formatted context generation

```python
from app.voice_agent import PatientService

patient_service = PatientService(
    api_url=settings.API_URL,
    therapist_id=therapist_id
)

# Get patient history
history = await patient_service.fetch_patient_history(patient_id)

# Format for Hume context
context = patient_service.format_history_for_context(history)
```

### SessionService
**Original implementation**

Manages therapy session lifecycle:
- Session CRUD operations
- Note management
- Progress tracking
- Concern flagging

```python
from app.voice_agent import SessionService

# Create session
session = await SessionService.create_session({
    "patient_id": patient_id,
    "therapist_id": therapist_id,
    "started_at": datetime.now()
})

# Add note (called by tools)
note = await SessionService.add_note(
    session_id=session_id,
    content="Patient shows increased confidence",
    category="observation",
    importance="medium",
    source="ai_agent"
)
```

## Configuration

### Deploy Hume Configuration

```bash
python -m app.voice_agent.config.deploy_therapist_agent
```

This creates/updates the Hume EVI configuration with:
- System prompt for therapy context
- Tool definitions (save_note, mark_progress, flag_concern, etc.)
- Voice settings (ITO voice, passive listening mode)
- GPT-4o-mini as base LLM

## Integration with Main Backend

The voice agent integrates with the main backend services:

```python
# In main.py or session handler
from app.voice_agent import HumeService, PatientService, SessionService
from app.services.graph_builder import GraphBuilder

# Initialize services
hume = HumeService(...)
patient_service = PatientService(...)
graph_builder = GraphBuilder()

# Start session
session = await SessionService.create_session(...)

# Get patient context
context = await patient_service.fetch_patient_history(patient_id)

# Inject into Hume
await hume.inject_context(context)

# Hume will call tools → updates graph → broadcasts to frontend
```

## Environment Variables

Required in `.env`:

```env
HUME_API_KEY=your_api_key
HUME_SECRET_KEY=your_secret_key
HUME_CONFIG_ID=your_config_id
```

## Reuse Attribution

This module reuses code from **CasiusAI Brian Agent**:
- `hume_service.py`: 90% reuse from `brian_agent/webhook_v0_livekit/hume_bridge.py`
- `patient_service.py`: 85% reuse from `brian_agent/services/property_service.py`
- Service patterns and architecture adapted for therapy use case

See `/home/marian/Dimini/REUSE_SUMMARY.md` for detailed reuse tracking.
