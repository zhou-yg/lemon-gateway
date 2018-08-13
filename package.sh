export ENV="online"
export NODE_ENV="production"

alias lnpm='cnpm --registry=http://120.27.130.189:7001 \
            --registryweb=http://120.27.130.189:7002 \
            --cache=$HOME/.npm/.cache/lnpm'
shopt -s  expand_aliases

npm run i
lnpm install

git checkout package.json

cd webapp/
lnpm install

# npm run build

# cd ../weike-data/
# cnpm install

cd ..

MACHINE_ENV=online node build-web.js

if [ -e dist ]
then
 rm -rf dist
fi
mkdir dist

cp package.json dist/
cp bin/server.json dist/pm2.json
cp -r bin dist/
cp -r config dist/
cp -r server dist/
cp -r node_modules dist/
cp -r mock dist/


echo 'package.sh done'
