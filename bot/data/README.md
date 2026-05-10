# Toolmetry AI Training Data

## Public Contribution File

**📁 `public-traindata.json`** - This is the file for community contributions!

### How to Contribute

1. **Edit `public-traindata.json`**
2. **Add new categories** to the `knowledgeBase` object
3. **Add pattern variations** (different ways users might say the same thing)
4. **Add responses** in both English (`en`) and Hinglish (`hi`)
5. **Keep responses under 250 characters**
6. **Use emojis** for better UX

### Example

```json
{
  "knowledgeBase": {
    "myNewCategory": {
      "patterns": ["keyword1", "keyword2", "another way to say it"],
      "responses": {
        "en": "Your English response here 😊",
        "hi": "Aapki Hinglish response yahan 🙏"
      }
    }
  }
}
```

## Pattern Matching

The AI uses **flexible matching**:
- **Direct match**: "password reset" → matches "password reset"
- **Partial match**: "my password no reset" → matches "password reset" (60% word match)
- **Word variations**: "forgot pass" → matches "forgot password"

## Files

- ✅ **`public-traindata.json`** - Public contribution file (edit this!)
- 🔒 **`traindata.json`** - Internal training data (don't edit)

## Language Support

- English
- Hinglish (Hindi + English mix)
- Add more Hindi words in `languageAdditions.hindiWords`

## Tips

- Add multiple patterns for the same intent
- Think about different ways users might ask
- Keep responses helpful and friendly
- Test patterns in Discord bot

Happy contributing! 🎉
