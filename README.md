# Dimini 🧠

**Real-time AI Therapy Assistant with Semantic Relationship Visualization**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-yellow)](https://www.python.org/)

---

## 🎯 What is Dimini?

Dimini is an **AI-powered therapy assistant** that creates **live semantic relationship maps** during therapy sessions. As therapists conduct sessions with patients, Dimini automatically visualizes the topics, emotions, and their connections in real-time, helping therapists better understand patterns and relationships in patient conversations.

### The Problem

During therapy sessions, therapists must:
- Actively listen to patients
- Take notes
- Identify patterns and connections
- Remember historical context
- Generate insights

This cognitive load can be overwhelming, potentially causing therapists to miss important connections between topics.

### The Solution

Dimini uses AI to:
- 🎤 **Listen** to therapy conversations (via voice integration)
- 🧠 **Extract** topics and emotions using GPT-4
- 🔗 **Connect** related concepts using semantic similarity (embeddings)
- 📊 **Visualize** relationships in a beautiful, animated graph
- 💡 **Analyze** sessions and generate insights

### Key Innovation: Semantic Relationships

Unlike traditional note-taking systems, Dimini uses **AI embeddings** to automatically connect concepts that are semantically related, even if mentioned at different times during the session.

**Example:**
- Minute 5: Patient mentions "girlfriend" and "argument"
- Minute 15: Patient mentions "anxiety" and "conflict avoidance"
- **Dimini automatically connects** "argument" ↔ "conflict avoidance" (similarity: 0.81)

---

## ✨ Features

### 🔴 Real-time Semantic Graph
- **Live visualization** of topics and emotions as they're discussed
- **Physics-based animation** - nodes self-organize into meaningful clusters
- **Semantic connections** - AI automatically links related concepts using embeddings
- **Interactive exploration** - Zoom, pan, and explore the therapy landscape

### 👥 Patient Management
- **Patient profiles** with demographics and history
- **Session management** - View past sessions and summaries
- **Historical graphs** - Replay past session visualizations
- **Search and filter** - Quickly find patients and sessions

### 🤖 AI-Powered Analysis
- **Entity extraction** - Automatically identify topics, emotions, people, and events
- **Relationship mapping** - Discover hidden connections between concepts
- **Session summaries** - AI-generated insights and recommendations
- **Pattern detection** - Identify recurring themes across sessions

### 🔌 Voice Agent Integration
- **RESTful API** for external voice agents
- **30-second update cycles** - Gradual graph building throughout session
- **Async processing** - Non-blocking transcript analysis
- **Status tracking** - Monitor session progress

---

## 🏗️ Architecture

### Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                             │
│  Next.js 14 • shadcn/ui • React Force Graph • TypeScript   │
└────────────────────┬────────────────────────────────────────┘
                     │ WebSocket (Supabase Realtime)
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                               │
│     PostgreSQL • Real-time Engine • pgvector                │
└────────────────────┬────────────────────────────────────────┘
                     │ REST API
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                       Backend                               │
│         FastAPI • Python 3.11 • OpenAI SDK                  │
└─────────────────────────────────────────────────────────────┘
                     │
                     ├──→ GPT-4 (Entity Extraction)
                     └──→ OpenAI Embeddings (Similarity)
```

### Why This Stack?

**Frontend:**
- **Next.js 14** - Modern React framework with excellent routing and performance
- **shadcn/ui** - Beautiful, accessible components with Tailwind CSS
- **React Force Graph** - Physics-based graph visualization with smooth animations
- **Supabase Client** - Real-time database subscriptions (WebSocket under the hood)

**Backend:**
- **FastAPI** - Modern Python web framework with automatic API docs
- **Async/await** - Non-blocking transcript processing
- **GPT-4** - Best-in-class entity extraction with function calling
- **OpenAI Embeddings** - Semantic similarity via cosine distance

**Database:**
- **Supabase** - Hosted PostgreSQL with real-time superpowers
- **Real-time Engine** - WebSocket subscriptions for live graph updates
- **pgvector** - Store embeddings for similarity calculations

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **Supabase Account** (free tier works great)
- **OpenAI API Key** (for GPT-4 and embeddings)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/dimini.git
cd dimini
```

#### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to **SQL Editor** and run the schema from `DEVELOPER_GUIDE.md`
3. Enable Realtime:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE graph_nodes;
   ALTER PUBLICATION supabase_realtime ADD TABLE graph_edges;
   ```
4. Get your API keys from **Project Settings → API**

#### 3. Set Up Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn python-dotenv
pip install openai supabase numpy pydantic pydantic-settings

# Create .env file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

**.env contents:**
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your_service_role_key
OPENAI_API_KEY=sk-proj-xxxxx
HOST=0.0.0.0
PORT=8000
DEBUG=true
ALLOWED_ORIGINS=http://localhost:3000
SIMILARITY_THRESHOLD=0.75
```

#### 4. Set Up Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Edit .env.local with your credentials
nano .env.local
```

**.env.local contents:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

#### 5. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 📖 Usage Guide

### For Therapists

#### 1. Create a Patient

1. Navigate to **Patients** page
2. Click **"New Patient"**
3. Enter patient information (name, email, demographics)
4. Save

#### 2. Start a Session

1. Go to patient profile
2. Click **"New Session"**
3. Session page opens with empty graph
4. **Voice agent** starts recording (handled externally)

#### 3. Watch the Graph Grow

As the conversation progresses:
- **Topics appear** as circles (e.g., "Work", "Girlfriend", "Therapy")
- **Emotions appear** in different colors (e.g., "Anxiety", "Joy", "Frustration")
- **Connections form** automatically between related concepts
- **Nodes cluster** naturally based on relationships

#### 4. End the Session

1. Click **"End Session"** button
2. AI generates session summary
3. Graph is saved for later review

#### 5. Review Past Sessions

1. Go to patient profile
2. Click on any past session
3. View the saved graph and summary
4. Compare patterns across sessions

---

### For Developers (Voice Agent Integration)

If you're building a voice agent that integrates with Dimini:

#### API Workflow

**1. Start Session**

```bash
POST /api/sessions/start
Content-Type: application/json

{
  "patient_id": "550e8400-e29b-41d4-a716-446655440000",
  "therapist_id": "dr_smith"
}
```

**Response:**
```json
{
  "id": "session_uuid",
  "status": "active",
  "started_at": "2024-01-15T14:30:00Z"
}
```

**2. Send Transcript Chunks (Every 30 seconds)**

```bash
POST /api/sessions/{session_id}/transcript
Content-Type: application/json

{
  "text": "Patient mentioned feeling anxious about work deadlines and relationship issues with girlfriend."
}
```

**Response:**
```json
{
  "nodes_added": [
    {"node_id": "anxiety", "label": "Anxiety", "node_type": "emotion"},
    {"node_id": "work", "label": "Work", "node_type": "topic"}
  ],
  "edges_added": [
    {"source": "anxiety", "target": "work", "similarity_score": 0.82}
  ],
  "status": "success"
}
```

**3. End Session**

```bash
POST /api/sessions/{session_id}/end
```

**Response:**
```json
{
  "id": "session_uuid",
  "status": "completed",
  "summary": {
    "key_topics": ["work", "relationships", "anxiety"],
    "insights": "...",
    "recommendations": [...]
  }
}
```

#### Integration Tips

- **Buffer 30 seconds** of transcript before sending
- **Handle async processing** - backend may take 2-4 seconds to respond
- **Check response status** - handle errors gracefully
- **Don't block UI** - process responses asynchronously
- **Test with mock data** first

---

## 🧪 How It Works: The AI Pipeline

### Step-by-Step Processing

#### 1. Voice Agent Sends Transcript
```
"I've been feeling really anxious lately. Work has been stressful,
and my relationship with my girlfriend is causing me worry."
```

#### 2. Backend Receives & Extracts Entities (GPT-4)

**Prompt to GPT-4:**
```
Extract topics and emotions from this therapy conversation:
[transcript]
```

**GPT-4 Response (Function Calling):**
```json
{
  "entities": [
    {"node_id": "anxiety", "node_type": "emotion", "label": "Anxiety"},
    {"node_id": "work", "node_type": "topic", "label": "Work"},
    {"node_id": "girlfriend", "node_type": "topic", "label": "Girlfriend"},
    {"node_id": "worry", "node_type": "emotion", "label": "Worry"}
  ]
}
```

#### 3. Generate Embeddings (OpenAI)

For each entity:
```python
embedding = openai.Embedding.create(
    model="text-embedding-3-small",
    input="anxiety"
)
# Returns: [0.123, -0.456, 0.789, ..., 0.234] (1536 dimensions)
```

#### 4. Calculate Semantic Similarity

Compare new entity "anxiety" with existing entities:

```python
def cosine_similarity(vec_a, vec_b):
    return dot(vec_a, vec_b) / (norm(vec_a) * norm(vec_b))

similarity("anxiety", "stress") = 0.89  ✅ Connected
similarity("anxiety", "work") = 0.78    ✅ Connected
similarity("anxiety", "girlfriend") = 0.34  ❌ Not connected (< 0.75)
```

#### 5. Insert to Database

```sql
-- Insert nodes
INSERT INTO graph_nodes (session_id, node_id, node_type, label, embedding)
VALUES ('session_uuid', 'anxiety', 'emotion', 'Anxiety', '{0.123, -0.456, ...}');

-- Insert edges (only if similarity > 0.75)
INSERT INTO graph_edges (session_id, source, target, similarity_score)
VALUES ('session_uuid', 'anxiety', 'work', 0.78);
```

#### 6. Supabase Realtime Broadcasts

**Database Trigger → WebSocket → Frontend**

Frontend receives update within 100ms:
```typescript
supabase.on('postgres_changes', { event: 'INSERT', ... }, (payload) => {
  // payload.new = {node_id: "anxiety", label: "Anxiety", ...}
  addNodeToGraph(payload.new);
});
```

#### 7. Graph Animates

React Force Graph updates:
- New node appears
- Physics simulation runs
- Node finds optimal position
- Edges connect to related nodes
- Smooth animation (400ms)

**Total latency:** 3-4 seconds from voice agent sending transcript to frontend showing new nodes.

---

## 📊 Database Schema

### Core Tables

#### `patients`
```sql
id              UUID PRIMARY KEY
name            TEXT
email           TEXT
demographics    JSONB
created_at      TIMESTAMPTZ
```

#### `sessions`
```sql
id              UUID PRIMARY KEY
patient_id      UUID → patients(id)
therapist_id    TEXT
started_at      TIMESTAMPTZ
ended_at        TIMESTAMPTZ
transcript      TEXT
summary         JSONB
status          TEXT ('active', 'completed')
```

#### `graph_nodes` ⭐ Core
```sql
id                  UUID PRIMARY KEY
session_id          UUID → sessions(id)
node_id             TEXT (normalized: "work_stress")
node_type           TEXT ('topic', 'emotion')
label               TEXT (display: "Work Stress")
embedding           VECTOR(1536)
properties          JSONB
first_mentioned_at  TIMESTAMPTZ
```

#### `graph_edges` ⭐ Core
```sql
id                  UUID PRIMARY KEY
session_id          UUID → sessions(id)
source_node_id      TEXT
target_node_id      TEXT
similarity_score    FLOAT (0.75 to 1.0)
relationship_type   TEXT ('related_to')
```

### Real-time Setup

```sql
-- Enable Realtime (CRITICAL)
ALTER PUBLICATION supabase_realtime ADD TABLE graph_nodes;
ALTER PUBLICATION supabase_realtime ADD TABLE graph_edges;
```

---

## 🎨 Graph Visualization Details

### Node Types

- **Topics** (Blue) - Concrete subjects: work, girlfriend, family, therapy
- **Emotions** (Red) - Emotional states: anxiety, joy, anger, sadness

### Edge Thickness

Edge width = `similarity_score * 3`

- Thick edges = Strong semantic similarity (0.85-1.0)
- Medium edges = Moderate similarity (0.75-0.85)

### Physics Configuration

```typescript
d3AlphaDecay: 0.02        // Slow cooldown = longer animation
d3VelocityDecay: 0.3      // Natural movement feel
linkDirectionalParticles: 2  // Animated particles along edges
```

### Interactive Controls

- **Zoom** - Mouse wheel or pinch
- **Pan** - Click and drag background
- **Node Click** - (Future) Show details in sidebar

---

## 🔐 Security & Privacy

### Data Protection

- **Patient data encrypted** at rest (Supabase encryption)
- **API keys** stored in environment variables (never committed)
- **CORS configured** to allow only trusted origins
- **Service role key** used only on backend (never exposed to frontend)

### HIPAA Compliance Considerations

⚠️ **Dimini is a demo/MVP and is NOT currently HIPAA-compliant.**

For production therapy use, you must:
- [ ] Sign Business Associate Agreement (BAA) with Supabase
- [ ] Implement proper authentication (OAuth2/OIDC)
- [ ] Enable Row-Level Security (RLS) in Supabase
- [ ] Add audit logging for all data access
- [ ] Encrypt transcripts at rest with customer-managed keys
- [ ] Implement session timeout and automatic logout
- [ ] Add user consent flows
- [ ] Regular security audits

### Recommended for Production

- **Authentication**: Auth0, Clerk, or Supabase Auth
- **Authorization**: Role-based access control (RBAC)
- **Encryption**: End-to-end encryption for transcripts
- **Audit Logs**: Track all access to patient data
- **Backup**: Automated backups with point-in-time recovery

---

## 🤝 Contributing

We welcome contributions! Here's how:

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow the installation steps in **Getting Started**
4. Make your changes
5. Test thoroughly
6. Commit: `git commit -m 'Add amazing feature'`
7. Push: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Code Style

**Backend (Python):**
- Follow PEP 8
- Use type hints
- Docstrings for all public functions
- Use `black` for formatting: `black app/`

**Frontend (TypeScript):**
- Follow Airbnb style guide
- Use TypeScript strict mode
- Prettier for formatting: `npm run format`
- ESLint for linting: `npm run lint`

### Testing

**Backend:**
```bash
cd backend
pytest tests/
```

**Frontend:**
```bash
cd frontend
npm test
```

### Pull Request Guidelines

- **One feature per PR**
- **Tests required** for new features
- **Update documentation** if changing APIs
- **Add screenshots** for UI changes
- **Reference issues** in PR description

---

## 📝 API Documentation

Full API documentation available at: http://localhost:8000/docs (when backend running)

### Quick Reference

#### Sessions

```
POST   /api/sessions/start          - Start new session
POST   /api/sessions/{id}/transcript - Update transcript
POST   /api/sessions/{id}/end        - End session
GET    /api/sessions/{id}/graph      - Get session graph
```

#### Patients

```
GET    /api/patients                 - List all patients
POST   /api/patients                 - Create patient
GET    /api/patients/{id}            - Get patient details
PATCH  /api/patients/{id}            - Update patient
DELETE /api/patients/{id}            - Delete patient
```

#### Health

```
GET    /api/health                   - Health check
GET    /                             - API status
```

---

## 🐛 Troubleshooting

### Real-time not working

**Problem:** Graph doesn't update in real-time.

**Solutions:**
1. Check Realtime is enabled:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE graph_nodes;
   ALTER PUBLICATION supabase_realtime ADD TABLE graph_edges;
   ```
2. Verify channel subscription in browser console
3. Check Row Level Security is disabled (for testing):
   ```sql
   ALTER TABLE graph_nodes DISABLE ROW LEVEL SECURITY;
   ```

### Force Graph blank screen

**Problem:** Graph component doesn't render.

**Solution:** Ensure dynamic import with `ssr: false`:
```typescript
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false
});
```

### OpenAI rate limits

**Problem:** 429 errors from OpenAI.

**Solutions:**
1. Upgrade to paid tier (60 RPM vs 3 RPM)
2. Implement retry logic with exponential backoff
3. Increase transcript buffering interval (30s → 60s)

### CORS errors

**Problem:** Frontend can't call backend.

**Solution:** Add frontend URL to CORS origins:
```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add your frontend URL
    ...
)
```

---

## 🗺️ Roadmap

### v1.0 (Current - MVP)
- [x] Real-time semantic graph visualization
- [x] Basic patient management
- [x] Voice agent API integration
- [x] Session summaries

### v1.1 (Next Release)
- [ ] Click nodes to see transcript excerpts
- [ ] Therapist annotations on nodes
- [ ] Export session graphs as PNG/PDF
- [ ] Multi-session timeline view

### v2.0 (Future)
- [ ] Historical pattern detection across sessions
- [ ] AI-suggested interventions
- [ ] Therapist collaboration features
- [ ] Mobile app (React Native)
- [ ] Integration with EHR systems

### v3.0 (Vision)
- [ ] Predictive analytics for patient outcomes
- [ ] Multi-language support
- [ ] Research dashboard for anonymized insights
- [ ] Community knowledge base

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

### Technologies

- **OpenAI** - GPT-4 and embeddings API
- **Supabase** - Database and real-time infrastructure
- **Vercel** - Next.js framework and deployment
- **Vasturiano** - React Force Graph library
- **shadcn** - Beautiful UI components

### Inspiration

Dimini was inspired by the need to reduce cognitive load on therapists while improving patient care through better pattern recognition and insight generation.

---

## 📞 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/dimini/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/dimini/discussions)
- **Email**: support@dimini.example.com

---

## 🎓 Learn More

### For AI/ML Developers

- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Semantic Similarity Explained](https://en.wikipedia.org/wiki/Cosine_similarity)
- [GPT-4 Function Calling](https://platform.openai.com/docs/guides/function-calling)

### For Full-Stack Developers

- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [React Force Graph](https://github.com/vasturiano/react-force-graph)

### For Therapists

- [How AI Can Assist Therapy](link-to-research)
- [Understanding Semantic Relationships](link-to-guide)
- [Privacy & Ethics in AI Therapy Tools](link-to-article)

---

## 📊 Project Stats

- **Lines of Code**: ~5,000 (estimated)
- **API Endpoints**: 10+
- **Database Tables**: 4 core tables
- **AI Models Used**: 2 (GPT-4, text-embedding-3-small)
- **Real-time Latency**: < 100ms
- **Average Session Processing**: 3-4 seconds per 30s chunk

---

## ⚡ Quick Start (TL;DR)

```bash
# 1. Clone and setup
git clone https://github.com/yourusername/dimini.git
cd dimini

# 2. Backend
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Add your API keys
uvicorn app.main:app --reload &

# 3. Frontend
cd ../frontend
npm install
cp .env.example .env.local  # Add your API keys
npm run dev &

# 4. Open http://localhost:3000
```

**That's it! You're running Dimini locally.** 🎉

---

## 💡 Use Cases

### Clinical Psychology
- Private practice therapists
- Mental health clinics
- Teletherapy platforms

### Research
- Psychology research labs
- Clinical trials
- Treatment effectiveness studies

### Education
- Psychology student training
- Supervisor-trainee review
- Case study analysis

### Organizational
- Employee assistance programs (EAP)
- Corporate mental health initiatives
- Coaching and development

---

## 🌟 Star History

If you find Dimini helpful, please consider starring the repository!

---

**Built with ❤️ for therapists and their patients.**

*Dimini - Illuminating the landscape of human conversation.*
