'''

Statement
Alice is playing a mobile game on a typical Saturday afternoon.

Before the game starts, Alice has A
 power level and there are N
 enemies with power level p1,p2,&,pN
.

Alice can do the following action zero or more times:

choose an enemy with strictly less power level than Alices power level. Kill the enemy and increase Alices power level by the enemys power level.
What is the minimum number of enemies Alice need to kill to have at least B
 power level? If this is impossible, output 1
.

There are T
 test cases to solve. Alice knows you are good in problem solving and requests your help to solve this game.

Note: You could only kill an enemy once as the enemy does not respawn after death.

Input format:
The first line contains the number of test cases T
 (1dTd20)
. The description of the test cases follows:

The first line of each test case contains three integers, N
 (1dNd1000)
 denoting the number of enemies, A
 (1dAd109)
 denoting Alices initial power level and B
 (1dBd109)
 denoting power level Alice needs to reach.
The second line of each test case contains n
 integers which describe the power levels of the enemies, pi
 (1dpid103)
 for the ith
 enemy.
It is guaranteed that the sum of N
 over all test cases does not exceed 1000
.

Output format:
For each test case, output a single integer denoting the minimum number of enemies Alice needs to kill to have at least B
 power level. If it is impossible, output 1
.

Sample Input:
2
5 3 10
4 3 4 1 2
3 20 100
70 86 19
Sample Output:
3
-1
Explanation
There are two test cases to solve.

For first test case, there are several ways to kill the enemies in which Alice reaches at least 10 power level in three kills. Here is an example, Alice has 3 power level initially and decide to kill the 4th
 enemy to gain 1 power level to 4. Next, Alice kills the 2nd
 enemy and gain 3 power level to 7. Lastly, Alice kills the 1st
 enemy to gain 4 power level to 11, which exceeds the 10 power level.

For second test case, the only enemy Alice could kill is the last enemy in which Alice gains 19 power level from 20 to 39. However, after that Alice could not kill any enemies, hence, it is impossible to reach 100 power level.

Permainan Mobile
Pernyataan
Alice sedang bermain suatu permainan mobile pada petang Sabtu.

Sebelum permainan bermula, Alice mempunyai tahap kuasa A
 dan mempunyai N
 musuh dengan tahap kuasa p1,p2,&,pN
.

Alice boleh membuat langkah berikut sama ada sifar atau beberapa kali:

pilih suatu musuh dengan tahap kuasa yang kurang daripada tahap kuasa Alice. Bunuh musuh tersebut dan tambahkan tahap kuasa Alice sebanyak tahap kuasa musuh tersebut.
Berapakah bilangan musuh terkecil yang Alice perlu bunuh untuk mencapai tahap kuasa sekurang-kurangnya B
? Jika ia tidak mungkin, output 1
.

Terdapat T
 kes ujian yang perlu diselesaikan. Alice tahu bahawa anda adalah seorang yang bijak menyelesaikan masalah dan meminta anda membantunya menyelesaikan permainan tersebut.

Nota: Anda hanya boleh membunuh setiap musuh sekali sahaja kerana musuh tidak akan dihidupkan semula selepas terbunuh.

Format Input:
Baris pertama mengandungi bilangan kes ujian T
 (1dTd20)
. Kes ujian dihuraikan seperti berikut:

Baris pertama bagi setiap kes ujian mengandungi tiga integer, N
 (1dNd1000)
 yang mewakili bilangan musuh, A
 (1dAd109)
 yang mewakili tahap kuasa Alice yang asal dan B
 (1dBd109)
 yang mewakili tahap kuasa yang Alice perlu capai.
Baris kedua bagi setiap kes ujian mengandungi n
 integer yang mewakili tahap kuasa bagi setiap musuh, pi
 (1dpid103)
 bagi musuh ke-i
.
Diketahui bahawa hasil tambah bagi N
 sepanjang semua kes ujian adalah tidak melebihi 1000
.

Format Output:
Bagi setiap kes ujian, output satu integer yang mewakili bilangan minimum musuh yang perlu dibunuh oleh Alice untuk mencapai tahap kuasa sekurang-kurangnya B
. Jika ia tidak mungkin, output 1
.

Contoh Input:
2
5 3 10
4 3 4 1 2
3 20 100
70 86 19
Contoh Output:
3
-1
Penjelasan
Terdapat dua kes ujian untuk diselesaikan.

Bagi kes ujian pertama, terdapat beberapa cara untuk membunuh musuh supaya Alice mencapai sekurang-kurangnya tahap kuasa 10 dengan tiga kali bunuhan. Contohnya, Alice mempunyai tahap kuasa 3 pada asalnya dan kemudian membunuh musuh ke-4
 untuk menambah 1 tahap kuasa kepada 4. Kemudian, Alice membunuh musuh ke-2
 untuk menambah 3 tahap kuasa kepada 7. Akhir sekali, Alice membunuh musuh ke-1
 untuk menambah 4 tahap kuasa kepada 11, yang melebihi tahap kuasa 10.

Bagi kes ujian kedua, satu-satunya musuh yang boleh dibunuh oleh Alice ialah musuh yang terakhir, yang menambahkahkan 19 tahap kuasa daripada 20 kepada 39. Walau bagaimanapun, selepas itu Alice tidak boleh membunuh mana-mana musuh lagi, maka mustahil bagi dia untuk mencapai tahap kuasa 100.

'''



import itertools

lines_of_all_numbers = []

print("Copy and paste the numbers and click 'Enter' twice: ")
while True:
  lines_of_numbers_input = input()

  if lines_of_numbers_input:
    lines_of_all_numbers.append(lines_of_numbers_input)
  else:
    break

lines_of_all_numbers[0] = int(lines_of_all_numbers[0])

for number_of_test_cases in range(int(lines_of_all_numbers[0])):
  temporary_list_for_test_cases_details = []

  temporary_list_for_test_cases_status_details = []
  temporary_list_for_test_cases_status_details = lines_of_all_numbers[number_of_test_cases + 1].split()
  temporary_list_for_test_cases_status_details = [int(status_details) for status_details in temporary_list_for_test_cases_status_details]

  temporary_list_for_test_cases_power_levels_of_enemines = []
  temporary_list_for_test_cases_power_levels_of_enemines = lines_of_all_numbers[number_of_test_cases + 2].split()
  temporary_list_for_test_cases_power_levels_of_enemines = sorted(temporary_list_for_test_cases_power_levels_of_enemines, key=int)
  temporary_list_for_test_cases_power_levels_of_enemines = [int(power_levels_of_enemines) for power_levels_of_enemines in temporary_list_for_test_cases_power_levels_of_enemines]

  temporary_list_for_test_cases_details.append(temporary_list_for_test_cases_status_details)
  temporary_list_for_test_cases_details.append(temporary_list_for_test_cases_power_levels_of_enemines)
  lines_of_all_numbers[number_of_test_cases + 1] = temporary_list_for_test_cases_details
  lines_of_all_numbers.remove(lines_of_all_numbers[number_of_test_cases + 2])

for test_case in range(lines_of_all_numbers[0]):

  minium_amounts_of_enemies_to_kill = []

  for length_of_trial_Alice_power_level_combination in range(len(lines_of_all_numbers[test_case + 1][1]), 0, -1):
    for trial_Alice_power_level_combination in itertools.combinations(lines_of_all_numbers[test_case + 1][1], length_of_trial_Alice_power_level_combination):


      eventual_Alice_power_level = lines_of_all_numbers[test_case + 1][0][1]
      minium_amount_of_enemies_to_kill = 0

      for enemy_power_level in list(trial_Alice_power_level_combination):

        if eventual_Alice_power_level > int(enemy_power_level):
          eventual_Alice_power_level += int(enemy_power_level)

          minium_amount_of_enemies_to_kill += 1

      if eventual_Alice_power_level >= lines_of_all_numbers[test_case + 1][0][2]:
        minium_amounts_of_enemies_to_kill.append(minium_amount_of_enemies_to_kill)
   

  if len(minium_amounts_of_enemies_to_kill) > 0:
    print(min(minium_amounts_of_enemies_to_kill))
  elif len(minium_amounts_of_enemies_to_kill) == 0:
    print("-1")