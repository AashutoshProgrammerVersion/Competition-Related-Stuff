"""
There are n magical orbs, the i-th orb has magical power ai. Evirir the dragon wizard wishes to combine all orbs to one super mega ultra magical orb. To do so, Evirir the dragon can do the following operation while there is more than one magical orb: Pick two orbs with power x and y. Destroy the two orbs and make a new orb with magical power x+2y. As Evirir the dragon did not graduate from wizard school, he needs your help to find the largest magical power the combined orb can have.
There are multiple test cases. The first line contains the number of test cases T.
Each for every test case, there are two line. The description of a test case follows. The first line of each test case contains a single integer n. The second line contains n integers a1,a2,…,an(0 ≤ ai ≤10^18) denoting the powers of the orbs. it is guaranteed that the sum of n over all test cases is at most 2 x (10^5). Output T lines. For each test case, output the biggest magical power you can achieve (modulo (10^9)+7).
"""


fileread = open('input.txt','r')
filewrite = open('output.txt','w')

lines_of_all_numbers = [i.strip() for i in fileread.readlines()]


number_of_test_cases = int(lines_of_all_numbers.pop(0))

for i in range(len(lines_of_all_numbers)):
    if len(lines_of_all_numbers[i]) == 1:
        lines_of_all_numbers[i] = int(lines_of_all_numbers[i])
    else:
        lines_of_all_numbers[i] = [int(x) for x in lines_of_all_numbers[i].split()]
        lines_of_all_numbers[i].sort(reverse=True)
        while len(lines_of_all_numbers[i]) > 1:
            lines_of_all_numbers[i][0] = lines_of_all_numbers[i][1] + (2 * lines_of_all_numbers[i][0])
            lines_of_all_numbers[i].pop(1)
        if (i-1)%2 == 0:
            print(lines_of_all_numbers[i][0] % ((10**9)+7))
            filewrite.write(str(lines_of_all_numbers[i][0] % ((10**9)+7)) + '\n')


fileread.close()
filewrite.close()