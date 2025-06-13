interface Experience {
    state: number[];
    action: number;
    reward: number;
    nextState: number[];
    done: boolean
}

type Matrix = number[][];

type LossFunction = {
    loss: (target: Matrix, output: Matrix) => Matrix;
    derivative: (target: Matrix, output: Matrix) => Matrix;
};


class QNeuralNetwork {
    structure: number[];
    weights: Matrix[];
    biases: Matrix[];
    lossFunction: LossFunction;

    constructor(structure: number[], lossFunction?: LossFunction) {
        this.structure = structure;
        this.weights = [];
        this.biases = [];
        this.lossFunction = lossFunction ?? this.meanSquaredError();

        for (let i = 1; i < structure.length; i++) {
            this.weights.push(this.randomMatrix(structure[i], structure[i - 1]));
            this.biases.push(this.randomMatrix(structure[i], 1));
        }
    }

    predict(inputArray: number[]): number[] {
        let input: Matrix = inputArray.map(x => [x]);

        for (let i = 0; i < this.weights.length; i++) {
            const w = this.weights[i];
            const b = this.biases[i];
            const z = this.add(this.multiply(w, input), b);
            input = z.map(row => [this.sigmoid(row[0])]);
        }

        return input.map(row => row[0]);
    }

    train(inputArray: number[], targetArray: number[], learningRate = 0.1): void {
        const inputs: Matrix[] = [inputArray.map(x => [x])];
        const outputs: Matrix[] = [];

        // Forward pass
        for (let i = 0; i < this.weights.length; i++) {
            const z = this.add(this.multiply(this.weights[i], inputs[i]), this.biases[i]);
            const activated = z.map(row => [this.sigmoid(row[0])]);
            inputs.push(activated);
            outputs.push(z);
        }

        const target: Matrix = targetArray.map(x => [x]);
        let error = this.lossFunction.derivative(target, inputs[inputs.length - 1]);

        // Backward pass
        for (let i = this.weights.length - 1; i >= 0; i--) {
            const output = inputs[i + 1];
            const gradient = this.multiplyElementwise(
                output.map(row => [this.dsigmoid(row[0])]),
                error
            );
            const gradientLR = this.multiplyScalar(gradient, learningRate);
            const inputT = this.transpose(inputs[i]);
            const weightDeltas = this.multiply(gradientLR, inputT);

            this.weights[i] = this.add(this.weights[i], weightDeltas);
            this.biases[i] = this.add(this.biases[i], gradientLR);

            const weightsT = this.transpose(this.weights[i]);
            error = this.multiply(weightsT, gradient);
        }
    }
    qTrain(exp: Experience, learningRate: number, gamma: number) {
        const currentQValues = this.predict(exp.state)
        const nextQValues = this.predict(exp.nextState)
        const targetQValues = [...currentQValues]
        if (exp.done) targetQValues[exp.action] = exp.reward
        else { targetQValues[exp.action] = exp.reward + gamma * Math.max(...nextQValues) }
        this.train(exp.state, targetQValues, learningRate)
    }

    // Loss: Mean Squared Error (default)
    private meanSquaredError(): LossFunction {
        return {
            loss: (target, output) =>
                this.subtract(target, output).map(row => [row[0] ** 2]),
            derivative: (target, output) =>
                this.subtract(target, output),
        };
    }

    // Optional: Cross-Entropy Loss (for binary classification)
    public crossEntropyLoss(): LossFunction {
        return {
            loss: (target, output) =>
                target.map((row, i) => [
                    -row[0] * Math.log(output[i][0] + 1e-8) -
                    (1 - row[0]) * Math.log(1 - output[i][0] + 1e-8),
                ]),
            derivative: (target, output) =>
                output.map((row, i) => [
                    -(target[i][0] - row[0]) /
                    ((row[0] + 1e-8) * (1 - row[0] + 1e-8)),
                ]),
        };
    }

    // Activation Functions
    private sigmoid(x: number): number {
        return 1 / (1 + Math.exp(-x));
    }

    private dsigmoid(y: number): number {
        return y * (1 - y);
    }

    // Matrix Utilities
    private add(a: Matrix, b: Matrix): Matrix {
        return a.map((row, i) => row.map((val, j) => val + b[i][j]));
    }

    private subtract(a: Matrix, b: Matrix): Matrix {
        return a.map((row, i) => row.map((val, j) => val - b[i][j]));
    }

    private multiply(a: Matrix, b: Matrix): Matrix {
        const result: Matrix = Array.from({ length: a.length }, () =>
            Array(b[0].length).fill(0)
        );
        for (let i = 0; i < a.length; i++) {
            for (let j = 0; j < b[0].length; j++) {
                for (let k = 0; k < a[0].length; k++) {
                    result[i][j] += a[i][k] * b[k][j];
                }
            }
        }
        return result;
    }

    private transpose(m: Matrix): Matrix {
        return m[0].map((_, i) => m.map(row => row[i]));
    }

    private multiplyScalar(m: Matrix, scalar: number): Matrix {
        return m.map(row => row.map(val => val * scalar));
    }

    private multiplyElementwise(a: Matrix, b: Matrix): Matrix {
        return a.map((row, i) => row.map((val, j) => val * b[i][j]));
    }

    private randomMatrix(rows: number, cols: number): Matrix {
        return Array.from({ length: rows }, () =>
            Array.from({ length: cols }, () => Math.random() * 2 - 1)
        );
    }
}



export class Agent {
    private experiences: Experience[] = [];
    private qNet: QNeuralNetwork;
    private structure: number[];
    private epsilon: number;
    private learninRate: number;
    private gamma: number;
    constructor(epsilon: number, learninRate: number, gamma: number, structure: number[]) {
        this.structure = structure
        this.epsilon = epsilon
        this.learninRate = learninRate
        this.gamma = gamma
        this.qNet = new QNeuralNetwork(structure)
    }
    selectAction(state: number[]) {
        if (Math.random() < this.epsilon) return Math.floor(Math.random() * this.structure[this.structure.length - 1])
        const predictions = this.qNet.predict(state)
        return predictions.indexOf(Math.max(...predictions))
    }
    store(exp: Experience) {
        this.experiences.push(exp)
    }
    train() {
        for (let i=0;i<Math.min(this.experiences.length,200);i++){
            const randExp = this.experiences[Math.floor(Math.random() * this.experiences.length)]
            this.qNet.qTrain(randExp,this.learninRate,this.gamma)
        }
        this.epsilon = this.epsilon * 0.99
    }


}