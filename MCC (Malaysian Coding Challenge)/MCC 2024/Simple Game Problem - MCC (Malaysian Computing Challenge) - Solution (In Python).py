"""
Evirir and Rhae are playing a game. Initially, there are n pairs of integers (a1,b1),…,(an,bn) and both players have 0 points. Evirir and Rhae take turns to act, with Evirir going first. On Evirir’s turn, they will choose a pair (ai,bi) that has not been removed, add ai to Evirir’s total score, and remove the pair (ai,bi). On Rhae’s turn, they will choose a pair (ai,bi) that has not been removed, add bi to Rhae’s total score, and remove the pair (ai,bi). The game ends when all pairs have been removed. Let X and Y be the final score of Evirir and Rhae, respectively. Evirir wants to maximize the value of X−Y and Rhae wants to minimize it. If both players play optimally, what is the final value of X−Y? The first line contains one integer, n (2 ≤n ≤ 10^4), the total number of pairs. The next n lines contains two space-separated integers, ai and b (−10^9 ≤ ai,bi ≤ 10^9), the values of ith pair. Output a single integer, the final value of X−Y if both players play optimally
"""


fileread = open('input.txt','r')
filewrite = open('output.txt','w')

lines_of_all_numbers = [i.strip() for i in fileread.readlines()]


number_of_pairs = int(lines_of_all_numbers.pop(0))
lines_of_all_numbers = [[int(x) for x in list(i.split())] for i in lines_of_all_numbers]

optimal_pairs_order = sorted(lines_of_all_numbers, key=lambda x:x[0] + x[1], reverse=True)
evirir_score = 0
rhae_score = 0

for i in range(number_of_pairs):
    if i % 2 == 0:
        evirir_score += optimal_pairs_order[0][0]
        optimal_pairs_order.pop(0)
    else:
        rhae_score += optimal_pairs_order[0][1]
        optimal_pairs_order.pop(0)

print(evirir_score - rhae_score)
filewrite.write(str(evirir_score - rhae_score))


fileread.close()
filewrite.close()