FROM redis:latest
COPY build_files/launcher.sh /usr/bin/launcher.sh
COPY build_files/redis.conf /usr/local/etc/redis/redis.conf

WORKDIR /
RUN chmod +x /usr/bin/launcher.sh
RUN mkdir -p /var/log/redis
ENTRYPOINT ["/usr/bin/launcher.sh"]
