#! /bin/bash

# Define a source directory (network or file share)
packages="/mnt/packages"
local_packages="./docker_files/packages"

build_files="/mnt/build_files"
local_build_files="./docker_files/build_files"

checksum="./checksums.txt"

mkdir -p "$local_packages"
mkdir -p "$local_build_files"

cp "$packages"/* "$local_packages"/
cp "$build_files"/* "$local_build_files"/

sha256sum -c checksums.txt > checksum_verify.txt

if grep -q "FAILED" checksum_verify.txt
then
	echo "Error: One ore more files failed checksum"
	cat checksum_verify.txt | grep "FAILED"
else
	echo "Success: All files passed checksum"
fi
