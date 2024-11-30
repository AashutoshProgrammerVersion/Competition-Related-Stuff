import re

f = open("Dracula.txt", "r")
input_string = f.read()
print(f)

clean_string = re.sub(r'[^\w\s]', '', input_string)
clean_string = clean_string.split()
clean_string = [x.lower() for x in clean_string]

words = set(clean_string)

print(clean_string)
print(words)

word_count = [clean_string.count(x) for x in words]

print(round(max(word_count)/len(words), 3))