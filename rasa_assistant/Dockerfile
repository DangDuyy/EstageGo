FROM rasa/rasa-pro:3.15.4

WORKDIR /app

COPY . /app

ENV RASA_LICENSE=${RASA_LICENSE}

EXPOSE 5005

CMD ["run", "--enable-api", "--cors", "*"]
