FROM oven/bun:1.1.0

WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install

COPY . .

EXPOSE 3000

# Add wait-for-it script to wait for database to be ready
RUN apt-get update && apt-get install -y wget bash
RUN wget -O /usr/local/bin/wait-for-it.sh https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh
RUN chmod +x /usr/local/bin/wait-for-it.sh

# Create entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["bun", "run", "dev"]