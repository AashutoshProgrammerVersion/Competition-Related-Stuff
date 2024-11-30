"""

Collatz (Solved) (100 / 100)
Statement
Evirir the dragon has a list of n
 integers a1,a2,&,an
. Evirir will repeat the following procedure k
 times:

For each integer ai
 in the list:
If ai
 is even, replace ai
 with ai2
.
Otherwise, replace ai
 with 3ai+1
.
In the end, what is the sum of all integers in the list?

Input Format
The first line consists of two integers n
 and k
 (1dnd1000,1dkd1000)
.
Then n
 integers follow: a1,a2&,an
 (1daid104)
.
Output Format
Output a single integer, the sum of the integers in the final list.

Sample Input 1
5 1
1 2 3 4 5
Sample Output 1
33
Explanation
After performing the procedure once, the list becomes {4,1,10,2,16}
.
Summing up, we get 4+1+10+2+16=33
.

Sample Input 2
6 3
3 1 4 1 5 9
Sample Output 2
33
Explanation
The list is changed like so: {3,1,4,1,5,9}’{10,4,2,4,16,28}’{5,2,1,2,8,14}’{16,1,4,1,4,7}
.
The sum of the integers in the final list is 16+1+4+1+4+7=33
.

Collatz
Pernyataan
Evirir sang Naga mempunyai suatu senarai n
 integer a1,a2,&,an
. Evirir akan mengulang langkah berikut sebanyak k
 kali:

Bagi setiap integer ai
 dalam senarai tersebut:
Jika ai
 adalah genap, gantikan ai
 dengan ai2
.
Selainnya, gantikan ai
 dengan 3ai+1
.
Pada akhirnya, apakah hasil tambah bagi semua integer dalam senarai tersebut?

Format Input
Baris pertama terdiri daripada dua integer n
 dan k
 (1dnd1000,1dkd1000)
.
Diikuti dengan n
 integer: a1,a2&,an
 (1daid104)
.
Format Output
Output satu integer, yang merupakan hasil tambah semua integer dalam senarai akhir tersebut.

Contoh Input 1
5 1
1 2 3 4 5
Contoh Output 1
33
Penjelasan
Selepas melakukan langkah tersebut sekali, senarai tersebut menjadi {4,1,10,2,16}
.
Tambahkan nombor-nombor tersebut untuk memperoleh 4+1+10+2+16=33
.

Contoh Input 2
6 3
3 1 4 1 5 9
Contoh Output 2
33
Explanation
Senarai tersebut diubahkan secara berikut: {3,1,4,1,5,9}’{10,4,2,4,16,28}’{5,2,1,2,8,14}’{16,1,4,1,4,7}
.
Hasil tambah semua integer dalam senarai akhir ialah 16+1+4+1+4+7=33
.
"""



lines_of_all_numbers = []
sum_of_integers_after_change = 0

print("Copy and paste the numbers and click 'Enter' twice: ")
while True:
  lines_of_numbers_input = input()

  if lines_of_numbers_input:
    lines_of_all_numbers.append(lines_of_numbers_input)
  else:
    break

numbers_for_calculations = lines_of_all_numbers[0].split()

list_of_numbers_to_change = lines_of_all_numbers[1].split()
for i in range(len(list_of_numbers_to_change)):
  list_of_numbers_to_change[i] = int(list_of_numbers_to_change[i])

for k in range(int(numbers_for_calculations[1])):
    for i in range(int(numbers_for_calculations[0])):
        if isinstance(list_of_numbers_to_change[i], int):
            if list_of_numbers_to_change[i] % 2 == 0:
                list_of_numbers_to_change[i]  =  list_of_numbers_to_change[i] / 2
                list_of_numbers_to_change[i] = int(list_of_numbers_to_change[i])
            else:
                list_of_numbers_to_change[i]  =  (list_of_numbers_to_change[i] * 3) + 1

for i in range(len(list_of_numbers_to_change)):
  if isinstance(list_of_numbers_to_change[i], int):
     sum_of_integers_after_change += list_of_numbers_to_change[i]
print(sum_of_integers_after_change)