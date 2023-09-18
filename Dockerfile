FROM node:18.15-alpine

WORKDIR /usr/src/app

COPY ./package*.json ./

RUN npm install

RUN npm install typescript@4.7.2 -g

COPY . .

RUN tsc

RUN npm install pm2 -g

CMD ["pm2-runtime","--raw","build/server.js","--name=leave-request-management","--no-daemon"]    