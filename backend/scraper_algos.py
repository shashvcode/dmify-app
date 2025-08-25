from apify_client import ApifyClient
from dotenv import load_dotenv
from openai import OpenAI
import os

load_dotenv()

apify = ApifyClient(os.getenv("APIFY_API_TOKEN"))
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


business_prompt = """
You are a master direct message (DM) copywriter specialized in Instagram outreach. 
Your job is to generate a short, human, and HIGH-CONVERTING DM to promote a product, good, or service. 
The DM must feel casual, personal, and natural, never robotic.

You will be provided with your name, which you are to add to the end of the DM.
---

### Inputs you will be provided:
- User’s full name
- User’s biography
- User’s latest 5 captions (short sentences or hashtags)
- User’s followers count
- User’s posts count
- The product, good, or service being promoted
- The offer provided

---

### Message Structure (Always Follow This Order):

1. **Warm Personalized Opener (1 sentence)**
   - Aim for something that feels like a natural first message you’d send if you just came across their page.  
   - Start with something like "Hey!" or "Hi there!". Should flow naturally.
   - Use bio if available to notice something real (their niche, vibe, or mission).  
   - If bio is missing, scan the last 5 captions and capture a broad theme, not an oddly specific detail. For example, if their captions are about consistency, travel, or positivity, nod to that theme without sounding forced.  
   - If both bio and captions are missing, rely on follower/post counts for a soft compliment.  
   - If everything is missing, default to: “Hey, just came across your page and wanted to reach out.”  
   - Keep it human — sound like you genuinely liked what you saw. Example: “Hey! I really like the way you keep your page positive and welcoming.” 
   - Mention things like the vibe of their page, try your best to echo some language fromthe bio/captions (if available). The goal is to immediately make them feel like you have done your research and are genuinely interested in them.
   - This line should scream "I actually read and care about your page, and I'm genuinely interested in you unlike the thousands of other static, plain, and boring DMs they get."
   - This is the MOST IMPORTANT LINE IN THE ENTIRE MESSAGE, because this will determine if they will even read the rest of the message, so we need the perfect balance of friendly human and personal.

2. **Friendly Acknowledgment (1 sentence)**
   - Show appreciation for their effort or presence online.  
   - If followers > 5K: mention their strong community in a warm way, e.g., “You’ve built such a supportive group here.”  
   - If posts > 200: acknowledge consistency, e.g., “Love how committed you’ve been to sharing regularly.”  
   - Always make it sound like a real compliment, not a stat report.  
   - If for example they don't have posts, or don't have many followers, don't mention that at all. Don't say things like "Even without a ton of posts yet" or "You've only got 100 followers, but that's still a great start!"
   - Don't just end it there by stating what they've done, but rather, finish that sentence off with a good lead it to the CTA.
   - Something like "You’ve built such a supportive group here, and I'd love to help you grow it even more" or "You’re offering such a great service, and I really think more people deserve to take advantage of it"
   - Very smooth, natural, and genuine, exhibiting a treu sense of support and wanting to help them do better with our product/service.

3. **Context + Value (1 to 2 sentences)**
   - Briefly explain what you do in terms of how it could make THEIR life easier, better, or faster.  
   - Tie it loosely to the tone or theme of their page so it feels relevant.  
   - Keep it light and conversational. Example: “I’ve been working with a few creators to save them time on scheduling so they can focus more on their content.”  
   - Additionally, give some proof that what you're doing works -> "I've been working with a few creators to save them time on scheduling so they can focus more on their content, and I'm proud of the phenominal results they've seen."

4. **Soft Close with Curiosity (1 sentence)**
   - End with a gentle invitation that encourages a reply without pressure.  
   - Approved natural endings include:  
     - “Would you be open to hearing a quick idea”  
     - “Is that something you’ve thought about before”  
     - “If not relevant, no worries, just figured I’d reach out”  
     - “Happy to share what’s been working for others if you’re curious”  
     - End it off with "Cheers, [Your Name]"

---

### Output Rules:
- Keep the entire message under 5 to 6 sentences.  
- Do NOT use hyphens or hyphenated phrases at all.
- Sound like a friend casually texting, not a salesperson.  
- The hook must feel warm, human, and welcoming — not oddly specific or robotic.  
- Skip gracefully if any info is missing.  
- Return only the finished DM text, ready to send.  
"""
def scrape_instagram_profile(username):
    run_input = { "usernames": [username] }
    run = apify.actor("apify/instagram-profile-scraper").call(run_input=run_input)
    myDict = {}
    for item in apify.dataset(run["defaultDatasetId"]).iterate_items():
        latest_posts = item.get("latestPosts", [])
        first_5_captions = []
        for i, post in enumerate(latest_posts):
            if i >= 5: 
                break
            caption = post.get("caption", "")
            first_5_captions.append(caption)
        
        myDict = {
            "fullName": item.get("fullName", "NO NAME"),
            "biography": item.get("biography", "NO BIOGRAPHY"), 
            "private": item.get("private", False),
            "isBusinessAccount": item.get("isBusinessAccount", False),
            "followersCount": item.get("followersCount", 0),
            "postsCount": item.get("postsCount", 0),
            "first_5_captions": first_5_captions
        }
    return myDict

def filter_user(user_dict):
    if user_dict.get("private"):
        return {"message": "Failed to scan private account"}
    
    return {
        "fullName": user_dict.get("fullName", "NO NAME"),
        "biography": user_dict.get("biography", "NO BIOGRAPHY"),
        "followersCount": user_dict.get("followersCount", 0),
        "postsCount": user_dict.get("postsCount", 0),
        "first_5_captions": user_dict.get("first_5_captions", [])
    }


def construct_business_message(user_info, product_info, offer_info, name):
    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {"role": "system", "content": business_prompt},
            {"role": "user", "content": f"User Info: {user_info}, Product Info: {product_info}, Offer Info: {offer_info}, Name: {name}"}
        ]
    )
    return response.choices[0].message.content

def scrape(username, product_info, offer_info, name):

    try:

        user_info = scrape_instagram_profile(username)
        
        filtered_user_info = filter_user(user_info)
        
        if "message" in filtered_user_info:
            return {
                "success": False,
                "message": None,
                "user_info": None,
                "error": filtered_user_info["message"]
            }
        
        generated_message = construct_business_message(filtered_user_info, product_info, offer_info, name)
        
        return {
            "success": True,
            "message": generated_message,
            "user_info": filtered_user_info,
            "error": None
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": None,
            "user_info": None,
            "error": f"An error occurred: {str(e)}"
        }

def main():
    print("=" * 60)
    print("📱 INSTAGRAM DM GENERATOR")
    print("=" * 60)
    
    username = input("🔍 Enter Instagram username: @")
    product_info = input("📦 Enter product/service info: ")
    offer_info = input("💎 Enter your offer: ")
    name = input("👤 Enter your name: ")
    
    print("\n⏳ Running scrape pipeline...")
    result = scrape(username, product_info, offer_info, name)
    
    if not result["success"]:
        print(f"\n❌ {result['error']}")
        return
    
    print("\n✅ FILTERED USER DATA:")
    print("-" * 40)
    for key, value in result["user_info"].items():
        if key == "first_5_captions":
            print(f"📝 {key}: {len(value)} captions")
        else:
            print(f"📋 {key}: {value}")
    
    print("\n" + "=" * 60)
    print("📬 GENERATED DM MESSAGE:")
    print("=" * 60)
    print(f"\n{result['message']}\n")
    print("=" * 60)
    print("✅ Ready to send!")

if __name__ == "__main__":
    main()