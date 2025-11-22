"""
Deploy Therapist AI Configuration to Hume AI platform
Adapted from: brian_agent/config/deploy_agent.py

Reuse: 95% - Configuration deployment logic
Adaptation: Brian Agent → Therapist AI tools and voice settings
"""

import os
from hume import HumeClient
from dotenv import load_dotenv

load_dotenv()

CONFIG_NAME = "TherapistAI_Production"


def deploy_therapist_agent():
    """
    Deploy Therapist AI configuration to Hume AI platform.

    Creates or updates Hume EVI configuration with:
    - Voice settings optimized for therapy
    - Tool definitions for session management
    - Listening mode operational parameters
    """
    api_key = os.getenv("HUME_API_KEY")
    if not api_key:
        raise ValueError("HUME_API_KEY not set in environment")

    client = HumeClient(api_key=api_key)
    print(f"Deploying Therapist AI configuration: '{CONFIG_NAME}'")

    # Step 1: Clean up existing configuration
    try:
        configs = client.empathic_voice.configs.list_configs()
        for config in configs:
            if config.name == CONFIG_NAME:
                print(f"Deleting existing config with ID: {config.id}")
                client.empathic_voice.configs.delete_config(id=config.id)
    except Exception as e:
        print(f"Error during cleanup: {e}")

    # Step 2: Load system prompt
    try:
        with open("prompts/therapist_system_prompt.md", "r", encoding="utf-8") as f:
            prompt_text = f.read()
        print("System prompt loaded successfully")
    except FileNotFoundError:
        raise FileNotFoundError("System prompt file not found: prompts/therapist_system_prompt.md")

    # Step 3: Create new configuration
    try:
        new_config = client.empathic_voice.configs.create_config(
            name=CONFIG_NAME,
            version_description="AI voice assistant for therapists. Passive listening with real-time emotion analysis and KG updates. Responds only when therapist queries.",
            evi_version="3",

            # Supplemental LLM for tool calling
            supplemental_llm={
                "model": "gpt-4o-mini",
                "temperature": 0.7,
                "max_tokens": 500
            },

            # System prompt
            prompt={"text": prompt_text},

            # Voice configuration (calm, professional)
            voice={
                "provider": "HUME_AI",
                "name": "ITO"  # Calm, professional voice
            },

            # Tool definitions
            tools=[
                {
                    "name": "save_session_note",
                    "description": "Save therapist observation or patient insight during session",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "note": {
                                "type": "string",
                                "description": "Content of the note to save"
                            },
                            "category": {
                                "type": "string",
                                "enum": ["insight", "observation", "concern", "progress"],
                                "description": "Category of the note"
                            },
                            "importance": {
                                "type": "string",
                                "enum": ["low", "medium", "high", "critical"],
                                "description": "Importance level"
                            }
                        },
                        "required": ["note", "category"]
                    }
                },
                {
                    "name": "update_kg_important",
                    "description": "Add significant emotional event or insight to knowledge graph",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "node_type": {
                                "type": "string",
                                "enum": ["emotion", "topic", "trigger", "insight", "breakthrough"],
                                "description": "Type of KG node to create"
                            },
                            "significance": {
                                "type": "string",
                                "enum": ["medium", "high", "critical"],
                                "description": "Significance level of this event"
                            },
                            "emotion": {
                                "type": "string",
                                "description": "Primary emotion associated with this event"
                            },
                            "trigger": {
                                "type": "string",
                                "description": "What triggered this emotional response"
                            },
                            "context": {
                                "type": "string",
                                "description": "Additional context about the event"
                            }
                        },
                        "required": ["node_type", "significance"]
                    }
                },
                {
                    "name": "mark_progress",
                    "description": "Flag patient breakthrough or significant therapeutic progress",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "progress_type": {
                                "type": "string",
                                "enum": ["emotional_regulation", "insight_gained", "behavioral_change", "coping_skill"],
                                "description": "Type of progress observed"
                            },
                            "description": {
                                "type": "string",
                                "description": "Description of the progress"
                            },
                            "evidence": {
                                "type": "string",
                                "description": "Specific evidence of this progress"
                            }
                        },
                        "required": ["progress_type", "description"]
                    }
                },
                {
                    "name": "flag_concern",
                    "description": "Flag concerning pattern or risk factor requiring therapist attention",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "concern_type": {
                                "type": "string",
                                "enum": ["emotional_distress", "risk_behavior", "deterioration", "crisis_indicator"],
                                "description": "Type of concern"
                            },
                            "severity": {
                                "type": "string",
                                "enum": ["moderate", "high", "urgent"],
                                "description": "Severity level"
                            },
                            "description": {
                                "type": "string",
                                "description": "Description of the concern"
                            },
                            "recommended_action": {
                                "type": "string",
                                "description": "Suggested therapist action"
                            }
                        },
                        "required": ["concern_type", "severity", "description"]
                    }
                },
                {
                    "name": "generate_session_summary",
                    "description": "Generate structured summary of therapy session",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "include_emotions": {
                                "type": "boolean",
                                "description": "Include emotional timeline"
                            },
                            "include_topics": {
                                "type": "boolean",
                                "description": "Include topics discussed"
                            },
                            "include_recommendations": {
                                "type": "boolean",
                                "description": "Include therapist recommendations"
                            }
                        }
                    }
                }
            ]
        )

        config_id = new_config.id
        print(f"\nSUCCESS! Configuration created with ID: {config_id}")

        # Step 4: Save configuration ID to .env
        with open(".env", "r+") as f:
            lines = f.readlines()
            f.seek(0)
            found = False

            for line in lines:
                if line.startswith("HUME_CONFIG_ID="):
                    f.write(f"HUME_CONFIG_ID={config_id}\n")
                    found = True
                else:
                    f.write(line)

            if not found:
                f.write(f"\nHUME_CONFIG_ID={config_id}\n")

            f.truncate()

        print(f"Configuration ID saved to .env file")
        print(f"\nConfiguration Details:")
        print(f"- Name: {CONFIG_NAME}")
        print(f"- EVI Version: 3")
        print(f"- Supplemental LLM: gpt-4o-mini")
        print(f"- Tools: 5 (save_note, update_kg, mark_progress, flag_concern, generate_summary)")
        print(f"- Voice: Hume AI (ITO)")

        return config_id

    except Exception as e:
        print(f"Error creating configuration: {e}")
        raise


if __name__ == "__main__":
    deploy_therapist_agent()
