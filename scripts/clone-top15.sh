#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/repos"
cd "$ROOT/repos"

clone() {
  local repo="$1"
  local dir="$2"
  if [ ! -d "$dir/.git" ]; then
    echo "Cloning $repo..."
    git clone --depth 1 "https://github.com/$repo.git" "$dir"
  else
    echo "Already present: $dir"
  fi
}

clone "Amarjha01/InfantCareCompass" "InfantCareCompass"
clone "espoon-voltti/evaka" "evaka"
clone "wysheng/kindergarten" "wysheng-kindergarten"
clone "Gracelaura/kindergarten-management-system-frontend" "kms-frontend"
clone "AnFengDe/afd_zaojiao" "afd_zaojiao"
clone "darkweb-alt/tinysteps" "tinysteps"
clone "Gracelaura/kindergarten-management-system-backend" "kms-backend"
clone "christancone/project1" "TinyToes"
clone "NadunKulatunge/KidsCave" "KidsCave"
clone "relyonOn/KindergartenManagement" "relyonOn-KindergartenManagement"
clone "gatsinski/kindergarten-management-system" "gatsinski-kms"
clone "cybasoft/carepro" "carepro"
clone "rehan243/sunshine-care-daycare-saas" "sunshine-care"
clone "YAS-1/Daystar_Daycare" "Daystar_Daycare"
clone "olamide226/nannybill" "nannybill"
