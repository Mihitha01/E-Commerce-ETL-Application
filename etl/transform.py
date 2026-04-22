import pandas as pd

def transform_data(df):
    df = df.copy()

    df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
    df['ship-city'] = df['ship-city'].fillna('').str.upper().str.strip()
    df['Qty'] = pd.to_numeric(df['Qty'], errors='coerce').fillna(0)
    df['Amount'] = pd.to_numeric(df['Amount'], errors='coerce').fillna(0.0)
    df['promotion-ids'] = df['promotion-ids'].fillna('').str.split(',')
    
    cols_to_keep = ['Order ID', 'Date', 'Status', 'SKU', 'Category', 
                    'Qty', 'Amount', 'ship-city', 'ship-state']
    df = df[cols_to_keep]

    print("Transformation complete.")
    return df