package com.soukon;

import javafx.application.Application;
import javafx.application.Platform;
import javafx.scene.Scene;
import javafx.scene.image.Image;
import javafx.scene.web.WebView;
import javafx.stage.Stage;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;

import java.util.Objects;

public class DesktopApplication extends Application {

    private ConfigurableApplicationContext applicationContext;

    @Override
    public void init() {
        this.applicationContext = new SpringApplicationBuilder(OfflineApplication.class).run();
    }

    @Override
    public void start(Stage stage) {
        WebView webView = new WebView();
        String port = applicationContext.getEnvironment().getProperty("server.port", "9915");
        String url = "http://localhost:" + port;
        webView.getEngine().load(url);

        // Enable responsive design features
        webView.setPrefSize(1280, 800);

        Scene scene = new Scene(webView);

        stage.setTitle("Auto Work Offline");
        try {
            stage.getIcons().add(new Image(Objects.requireNonNull(getClass().getResourceAsStream("/static/favicon.ico"))));
        } catch (Exception e) {
            // Icon not found, continue without it
        }
        stage.setScene(scene);
        stage.show();
    }

    @Override
    public void stop() {
        this.applicationContext.close();
        Platform.exit();
    }

    public static void main(String[] args) {
        launch(args);
    }
} 