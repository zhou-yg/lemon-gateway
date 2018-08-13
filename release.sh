releaseText=$1
branch=$2

defaultText=`date +%Y%m%d%H%M%S`

if [ ! $releaseText ]
then
  releaseText="$defaultText"
fi

git checkout develop
git pull origin develop
git checkout master
git pull origin master

git flow release start $releaseText
git flow release finish $releaseText

git checkout develop
