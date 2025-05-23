FROM oven/bun:1.1.0

WORKDIR /app

# Copy special package.json for Docker first (without workspaces)
COPY package.json ./
COPY bun.lockb* ./

# Copy app code
COPY apps ./apps

# Install dependencies 
RUN bun install

# Copy everything else
COPY . .

EXPOSE 3000

# Add wait-for-it script to wait for database to be ready
RUN apt-get update && apt-get install -y wget bash
RUN wget -O /usr/local/bin/wait-for-it.sh https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh
RUN chmod +x /usr/local/bin/wait-for-it.sh

# Move entrypoint script to correct location and set permissions
RUN chmod +x /usr/local/bin/docker-entrypoint.sh || cp docker-entrypoint.sh /usr/local/bin/ && chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["bun", "run", "dev"]