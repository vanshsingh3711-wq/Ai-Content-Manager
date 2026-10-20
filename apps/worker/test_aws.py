from dotenv import load_dotenv
load_dotenv('../../.env')
import boto3
client = boto3.client('bedrock', region_name='us-east-1')
try:
    response = client.list_foundation_models(byProvider='anthropic')
    for m in response['modelSummaries']:
        if 'opus' in m['modelId']:
            print(m['modelId'])
except Exception as e:
    print("Error:", e)
