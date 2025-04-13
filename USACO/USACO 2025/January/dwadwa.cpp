#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    int number_of_cows;
    cin >> number_of_cows;
    
    vector<int> cow_numbers(number_of_cows);
    for (int i = 0; i < number_of_cows; i++) {
        cin >> cow_numbers[i];
    }
    
    vector<int> doctor_want_cow_numbers(number_of_cows);
    for (int i = 0; i < number_of_cows; i++) {
        cin >> doctor_want_cow_numbers[i];
    }
    
    vector<int> number_of_operations_causing_cow_check(number_of_cows + 1, 0);
    
    for (int i = 0; i < number_of_cows; i++) {
        for (int j = 0; j < number_of_cows - i; j++) {
            if (i == j + i) {
                int number_of_cows_operated = 0;
                vector<int> simulated_cow_numbers = cow_numbers;
                for (int x = 0; x < number_of_cows; x++) {
                    if (simulated_cow_numbers[x] == doctor_want_cow_numbers[x]) {
                        number_of_cows_operated++;
                    }
                }
                number_of_operations_causing_cow_check[number_of_cows_operated]++;
            } else {
                int number_of_cows_operated = 0;
                vector<int> simulated_cow_numbers = cow_numbers;
                vector<int> simulated_cow_numbers_to_reverse(simulated_cow_numbers.begin() + i, simulated_cow_numbers.begin() + i + j + 1);
                
                reverse(simulated_cow_numbers_to_reverse.begin(), simulated_cow_numbers_to_reverse.end());
                
                copy(simulated_cow_numbers_to_reverse.begin(), simulated_cow_numbers_to_reverse.end(), simulated_cow_numbers.begin() + i);
                
                for (int x = 0; x < number_of_cows; x++) {
                    if (simulated_cow_numbers[x] == doctor_want_cow_numbers[x]) {
                        number_of_cows_operated++;
                    }
                }
                number_of_operations_causing_cow_check[number_of_cows_operated]++;
            }
        }
    }
    
    for (int i : number_of_operations_causing_cow_check) {
        cout << i << endl;
    }
    
    return 0;
}