FROM node:20.7.0

WORKDIR /sdl-frontend-main

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

CMD [ "npm", "run", "dev" ]