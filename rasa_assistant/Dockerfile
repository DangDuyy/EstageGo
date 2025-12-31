FROM rasa/rasa-pro:3.15.4

WORKDIR /app
COPY . /app

ARG RASA_LICENSE
ENV RASA_LICENSE=$RASA_LICENSE

EXPOSE 5005

CMD ["run",
     "--enable-api",
     "--cors", "*",
     "--port", "5005",
     "--host", "0.0.0.0"]
