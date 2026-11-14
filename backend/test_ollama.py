import asyncio
from app.llm.ollama_client import ollama_client
from app.agents.personalities import AGENT_PROFILES

async def main():
    health = await ollama_client.check_health()
    print("Ollama Health Check:", "PASSED" if health else "FAILED")
    if health:
        alex = AGENT_PROFILES["alex"]
        print("Testing local Ollama llama3.2 with Alex the Farmer prompt...")
        system_prompt = f"You are {alex['name']}, a {alex['occupation']} in Tiny Society. Keep your reply to 1 brief sentence."
        resp = await ollama_client.generate(
            prompt="Good morning Alex! What are you planning to do on the farm today?",
            system=system_prompt
        )
        print("Alex's AI Response:", resp.strip())

if __name__ == "__main__":
    asyncio.run(main())
