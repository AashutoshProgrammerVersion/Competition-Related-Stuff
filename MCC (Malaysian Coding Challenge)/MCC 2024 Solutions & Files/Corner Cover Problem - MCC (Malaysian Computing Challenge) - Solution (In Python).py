"""
Evirir has a n time m grid. The cell in row i and column j is called (i,j). The corners cells are the cells (1,1), (1,m), (n,1) and (n,m). Evirir wants to choose a A x B or a B X A subgrid in the grid such that the subgrid contains at least two corner cells. Is this possible? There are multiple test cases. The first line contains the number of test cases T. Each of the next T lines contains a test case. The description of a test case follows: the only line of each test case contains four space-separated integers, n, m, A and B (2 ≤ (n,m,A,B) ≤ 10^18).
"""

fileread = open('input.txt','r')
filewrite = open('output.txt','w')

lines_of_all_numbers = [i.strip() for i in fileread.readlines()]
print(lines_of_all_numbers)


number_of_test_cases = int(lines_of_all_numbers.pop(0))
lines_of_all_numbers = [[int(x) for x in list(i.split())] for i in lines_of_all_numbers]
print(lines_of_all_numbers)

for i in range(number_of_test_cases):
    if (lines_of_all_numbers[i][0] >= lines_of_all_numbers[i][2] and lines_of_all_numbers[i][1] >= lines_of_all_numbers[i][3]) or (lines_of_all_numbers[i][0] >= lines_of_all_numbers[i][3] and lines_of_all_numbers[i][1] >= lines_of_all_numbers[i][2]):
        if (lines_of_all_numbers[i][0] == lines_of_all_numbers[i][2] or lines_of_all_numbers[i][0] == lines_of_all_numbers[i][3]) or (lines_of_all_numbers[i][1] == lines_of_all_numbers[i][2] or lines_of_all_numbers[i][1] == lines_of_all_numbers[i][3]):
            filewrite.write("YES\n")
            print("YES")
        else:
            filewrite.write("NO\n")
            print("NO")
    else:
        filewrite.write("NO\n")
        print("NO")

fileread.close()
filewrite.close()