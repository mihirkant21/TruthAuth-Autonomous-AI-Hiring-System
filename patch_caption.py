filepath = r'e:\Hackathon\ET\frontend\src\components\CandidatePortal.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

idx = content.find('Stop & Submit Answer')
# Get chars from there to the closing )}
end = content.find(')}', idx) + 2
chunk = content[idx:end]
with open(r'e:\Hackathon\ET\debug_out.txt', 'w') as f:
    f.write(repr(chunk))
print("Written", len(chunk), "chars")
