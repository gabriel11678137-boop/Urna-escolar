
import java.util.HashMap;
import java.util.Map;

public class Chapa {

    private static final Map<String, Boolean> ALUNOS = new HashMap<>();

    static {
        ALUNOS.put("A001", false);
        ALUNOS.put("A002", false);
        ALUNOS.put("A003", false);
        ALUNOS.put("A004", false);
        ALUNOS.put("A005", false);
    }
    private int[] votos = new int[8];
    private int totalVotos = 0;
    private Integer codigoEleitorAtual = null;

    String nome;
    int numero;

    public static void main(String[] args) {
        //Instanciando as chapas reais
        Chapa chapa1 = new Chapa();
        chapa1.nome = "Inovacao";
        chapa1.numero = 10;

        System.out.println("Chapa " + chapa1.numero + ": " + chapa1.nome);

        Chapa chapa2 = new Chapa();
        chapa2.nome = "Futuro";
        chapa2.numero = 20;

        System.out.println("Chapa " + chapa2.numero + ": " + chapa2.nome);

        Chapa chapa3 = new Chapa();
        chapa3.nome = "Transformacao";
        chapa3.numero = 30;
        System.out.println("Chapa " + chapa3.numero + ": " + chapa3.nome);
    }
}
s
