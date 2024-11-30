from string import punctuation


quote = "hi im rain."
for symbol in punctuation:
    quote = quote.replace(symbol, '')

longest_word = max(quote.split(), key=lambda word: len(word))
print(longest_word)
