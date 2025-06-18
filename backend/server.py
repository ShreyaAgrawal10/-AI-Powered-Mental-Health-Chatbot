from flask import Flask, request, jsonify
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import re
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow frontend to access backend

# Load your fine-tuned model
model_dir = "./mental_health_chatbot_model"  # adjust this if needed
tokenizer = AutoTokenizer.from_pretrained(model_dir)
model = AutoModelForCausalLM.from_pretrained(model_dir)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)

def generate_response(input_text):
    prompt = f"<s>[INST] {input_text} [/INST]"
    inputs = tokenizer(prompt, return_tensors="pt").to(device)

    with torch.no_grad():
        output = model.generate(
            inputs.input_ids,
            max_length=inputs.input_ids.shape[1] + 100,
            temperature=0.7,
            do_sample=True,
            top_p=0.95,
            pad_token_id=tokenizer.pad_token_id,
            attention_mask=inputs.attention_mask
        )

    decoded = tokenizer.decode(output[0], skip_special_tokens=False)
    match = re.search(r'\[\/INST\](.*?)(?:<\/s>|$)', decoded, re.DOTALL)
    return match.group(1).strip() if match else decoded.split('[/INST]')[-1].strip()

@app.route('/chat', methods=['POST'])
def chat():
    user_input = request.json.get('message')
    response = generate_response(user_input)
    return jsonify({'response': response})

if __name__ == '__main__':
    app.run(port=5000)
