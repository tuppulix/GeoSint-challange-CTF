FROM node:18

WORKDIR /usr/src/app

# Install app dependencies
# COPY package*.json ./
RUN npm install body-parser cookie-parser express jsdom node-fetch@2 @photo-sphere-viewer/core

COPY . .

#RUN rm -f ./public/img/chall*/*

#RUN node pull_challs_fast.js

EXPOSE 6958

CMD [ "node", "server.js" ]

