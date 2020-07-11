package words;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Controller
public class GreetingController {

    private final SimpMessagingTemplate messageTemplate;
    private static List<String> words = new ArrayList<>();
    private String currentWord;
    private static List<String> currentWords = new ArrayList<>();;
    private ScheduledExecutorService executorService;

    @Autowired
    public GreetingController(SimpMessagingTemplate messagingTemplate) {
        this.messageTemplate = messagingTemplate;
    }

    static {
        create();
    }

    private static void create() {
        words.add("Безразличие");
        words.add("Благодарность");
        words.add("Вина");
        words.add("Возмущение");
        words.add("Гордость");
        words.add("Грусть");
        words.add("Злость");
        words.add("Интерес");
        words.add("Нежность");
        words.add("Обида");
        words.add("Отвращение");
        words.add("Радость");
        words.add("Раздражение");
        words.add("Стеснительность");
        words.add("Страх");
        words.add("Тревога");
        words.add("Удивление");
    }

    @MessageMapping("/hello")
    @SendToUser("/queue/words")
    public Greeting greeting(Answer message) {
        Boolean shouldReply = parseInput(message.getName());
        if (words.isEmpty()) {
            sendToAll("End of the game", "/topic/greetings");
            return null;
        }
        if (currentWords.isEmpty() && !message.getName().equals("restart")) {
            sendToAll("next", "/topic/next");
            executorService.shutdownNow();
            return null;
        }
        if (!shouldReply) {
            return null;
        }
        Random r = new Random();
        int index = r.nextInt(currentWords.size());
        currentWord = currentWords.get(index);
        System.out.println(currentWords);
        return new Greeting(currentWord);
    }

    private void sendToAll(String message, String path) {
        messageTemplate.convertAndSend(path, new Greeting(message));
    }

    private boolean parseInput(String message) {
        switch (message) {
            case "correct":
                System.out.println("Correct: " + currentWord);
                words.remove(currentWord);
                currentWords.remove(currentWord);
                return true;
            case "incorrect":
                System.out.println("Incorrect: " + currentWord);
                return true;
            case "start":
                System.out.println("start");
                Random rand = new Random();
                List<String> wordsCopy = new ArrayList<>(words);
                for (int i = 0; i < 5 && !wordsCopy.isEmpty(); i++) {
                    currentWords.add(wordsCopy.remove(rand.nextInt(wordsCopy.size())));
                }
                sendToAll("start", "/topic/block");
                executorService  = Executors.newSingleThreadScheduledExecutor();
                executorService.schedule(this::timesUp, 63, TimeUnit.SECONDS);
                return true;
            case "restart":
                System.out.println("restart");
                create();
                sendToAll("restart", "/topic/restart");
                return false;
        }
        return false;
    }

    private void timesUp() {
        System.out.println("Time is up");
        currentWords.clear();
        sendToAll("next", "/topic/next");
    }
}
