import sys

input_file = open("speeding.in", 'r')
output_file = open("speeding.out", 'w')

road_segments_counter = 0
road_segments_for_cow_counter = 0

lengths_and_speeds = []
lengths_and_speeds_for_cow = []
list_of_exceeded_speeds = [0]

number_of_road_segments, number_of_cow_segments = map(int, input_file.readline().split())
print(number_of_road_segments, number_of_cow_segments)

for i in range(number_of_road_segments):
    road_length, road_speed = map(int, input_file.readline().split())
    lengths_and_speeds.append((road_length, road_speed))
print(lengths_and_speeds)

for i in range(number_of_cow_segments):
    road_length, road_speed = map(int, input_file.readline().split())
    lengths_and_speeds_for_cow.append((road_length, road_speed))
print(lengths_and_speeds_for_cow)

covered_length = lengths_and_speeds[0][0]
covered_length_for_cow = lengths_and_speeds_for_cow[0][0]


while road_segments_counter < number_of_road_segments or road_segments_for_cow_counter < number_of_cow_segments:

    if covered_length > covered_length_for_cow:
        if lengths_and_speeds[road_segments_counter][1] < lengths_and_speeds_for_cow[road_segments_for_cow_counter][1]:
            list_of_exceeded_speeds.append(lengths_and_speeds_for_cow[road_segments_for_cow_counter][1] - lengths_and_speeds[road_segments_counter][1])
            print(list_of_exceeded_speeds)
        road_segments_for_cow_counter += 1
        print(road_segments_for_cow_counter)
        if road_segments_counter < number_of_road_segments or road_segments_for_cow_counter < number_of_cow_segments:
            covered_length_for_cow += lengths_and_speeds_for_cow[road_segments_for_cow_counter][0]
    
    elif covered_length == covered_length_for_cow:
        if lengths_and_speeds[road_segments_counter][1] < lengths_and_speeds_for_cow[road_segments_for_cow_counter][1]:
            list_of_exceeded_speeds.append(lengths_and_speeds_for_cow[road_segments_for_cow_counter][1] - lengths_and_speeds[road_segments_counter][1])
            print(list_of_exceeded_speeds)
        road_segments_counter += 1
        print(road_segments_counter)
        road_segments_for_cow_counter += 1
        print(road_segments_for_cow_counter)
        if road_segments_counter < number_of_road_segments or road_segments_for_cow_counter < number_of_cow_segments:
            covered_length += lengths_and_speeds[road_segments_counter][0]
            covered_length_for_cow += lengths_and_speeds_for_cow[road_segments_for_cow_counter][0]

    elif covered_length < covered_length_for_cow:
        if lengths_and_speeds[road_segments_counter][1] < lengths_and_speeds_for_cow[road_segments_for_cow_counter][1]:
            list_of_exceeded_speeds.append(lengths_and_speeds_for_cow[road_segments_for_cow_counter][1] - lengths_and_speeds[road_segments_counter][1])
            print(list_of_exceeded_speeds)
        road_segments_counter += 1
        print(road_segments_counter)
        if road_segments_counter < number_of_road_segments or road_segments_for_cow_counter < number_of_cow_segments:
            covered_length += lengths_and_speeds[road_segments_counter][0]

print(max(list_of_exceeded_speeds))
output_file.write(f"{max(list_of_exceeded_speeds)}")