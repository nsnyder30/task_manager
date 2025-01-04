FROM almalinux:latest
COPY build_files/launcher.sh /usr/bin/launcher.sh
WORKDIR /app

RUN dnf module enable nodejs:20 -y || echo "ERROR: Failed to enable noejs module version 20" \
	&& dnf install nodejs vim git net-tools -y || echo "ERROR: Failted to install required packages" \
	&& git config --global user.name "Neil Snyder"  || echo "ERROR: Failed to configure default git username" \
	&& git config --global user.email "neil.r.snyder@gmail.com" || echo "ERROR: Failed to configure default git email" \
	&& npm install -g @angular/cli || echo "ERROR: Failed to enable angular globally"
RUN chmod +x /usr/bin/launcher.sh
