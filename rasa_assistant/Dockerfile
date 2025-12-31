FROM rasa/rasa-pro:3.15.4

WORKDIR /app
COPY . /app

ARG RASA_LICENSE
ENV RASA_LICENSE=$RASA_LICENSE

# Train model khi build
RUN rasa train

EXPOSE 5005

CMD ["sh", "-c", "rasa run --enable-api --cors \"*\" --interface 0.0.0.0 -p ${PORT:-5005}"]