import re

# Read the minified file
with open(r'C:\Users\Rafa\Desktop\Cuckoo\3.99.4_0\assets\premium-CHh0JHCP.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract Claude API sections
claude_patterns = [
    r'.{0,300}https://claude\.ai/api/organizations.{0,800}',
    r'organizationId.{0,500}completion.{0,500}',
    r'sessionKey.{0,300}',
]

print("="*80)
print("CLAUDE API IMPLEMENTATIONS")
print("="*80)

for pattern in claude_patterns:
    matches = re.findall(pattern, content, re.DOTALL)
    if matches:
        for i, match in enumerate(matches[:2]):  # Show first 2 matches
            print(f"\n--- Match {i+1} for pattern: {pattern[:50]}... ---")
            print(match[:1000])  # Print first 1000 chars

# Extract Perplexity API sections
print("\n" + "="*80)
print("PERPLEXITY API IMPLEMENTATIONS")
print("="*80)

pplx_patterns = [
    r'.{0,300}perplexity\.ai/rest/sse.{0,800}',
    r'.{0,300}www\.perplexity\.ai.{0,800}',
]

for pattern in pplx_patterns:
    matches = re.findall(pattern, content, re.DOTALL | re.IGNORECASE)
    if matches:
        for i, match in enumerate(matches[:2]):  # Show first 2 matches
            print(f"\n--- Match {i+1} for pattern: {pattern[:50]}... ---")
            print(match[:1000])  # Print first 1000 chars

# Try to find class definitions
print("\n" + "="*80)
print("LOOKING FOR CLASS DEFINITIONS")
print("="*80)

# Find classes with "Claude" or "Perplexity" or "Pplx"
class_patterns = [
    r'class \w{1,30}\{[^}]{0,2000}claude\.ai[^}]{0,2000}\}',
    r'class \w{1,30}\{[^}]{0,2000}perplexity\.ai[^}]{0,2000}\}',
]

for pattern in class_patterns:
    matches = re.findall(pattern, content, re.DOTALL | re.IGNORECASE)
    if matches:
        for i, match in enumerate(matches[:1]):
            print(f"\n--- Class Match {i+1} ---")
            print(match[:1500])
