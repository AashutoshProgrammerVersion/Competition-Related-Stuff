"""
A binary string is a string consisting of 0s and 1s. You are given a binary string s=s1s2…sn of length n and an integer (k ≥ 0). For a binary string t=t1t2…tm (m≥2), transforming t means changing t to t1(t1⊕t2)t2(t2⊕t3)t3...(tm-1⊕tm)tm, where ⊕ is the bitwise XOR operator. Here, t1(t1⊕t2)t2(t2⊕t3)t3...(tm-1⊕tm)tm is the result of applying the XOR operation to t1, t2, t3, …, tm. For example, 011 transformed is 01101, and 10011 transformed is 110001101. The beauty of a binary string t=t1t2…tm (m≥2) is the number of integers i (1≤i<m) such that ti=ti+1. We will denote the beauty of t by f(t). For example, f(10010111)=3, f(010)=0, and f(000)=2. Also, define g(t) to be the value of f(t′), where t′ is t transformed k times. Output the sum of g(t) over all substrings of s with length at least 2.
The first line contains two space-separated integers, n and k (2 ≤ n ≤ 2⋅10^5, 0 ≤ k ≤ 10^18). The second line contains s, a binary string of length n.
Output a single integer, the sum of g(t) of all substrings t of s with length at least 2, modulo 998244353.
"""


fileread = open('input.txt','r')
filewrite = open('output.txt','w')

lines_of_all_numbers = [i.strip() for i in fileread.readlines()]


length_of_binary_string, number_of_times_to_transform = map(int, lines_of_all_numbers.pop(0).split())
binary_string = lines_of_all_numbers[0]
dictionary_of_all_substrings = {}
total_beauty = 0

def transform_string(string):
    resultant_string_array = []
    for i in range(len(string) - 1):
        resultant_string_array.append(string[i])
        resultant_string_array.append(str(int(string[i]) ^ int(string[i + 1])))
    resultant_string_array.append(string[-1])
    return ''.join(resultant_string_array)


def beauty_of_string(string):
    beauty = 0
    for i in range(len(string) - 1):
        if string[i] == string[i + 1]:
            beauty += 1
    return beauty

for i in range(2, len(binary_string) + 1):
    for j in range(len(binary_string) - i + 1):
        if binary_string[j:j + i] in list(dictionary_of_all_substrings.keys()):
            dictionary_of_all_substrings[binary_string[j:j + i]] += 1
        else:
            dictionary_of_all_substrings[binary_string[j:j + i]] = 1

for i in range(len(dictionary_of_all_substrings.keys())):
    temporary_number = list(dictionary_of_all_substrings.keys())[i]
    for j in range(number_of_times_to_transform):
        temporary_number = transform_string(temporary_number)
    total_beauty += beauty_of_string(temporary_number) * list(dictionary_of_all_substrings.values())[i]

print(total_beauty % 998244353)

#fileread.close()
#filewrite.close()