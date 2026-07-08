import logging
import os
from datetime import datetime

Log_file_name=f"{datetime.now().strftime('%m_%d_%Y_%H_%M_%S')}.log"

Log_path=os.path.join(os.getcwd(),'logs')

##Creating a log directory 
os.makedirs(Log_path,exist_ok=True) ## creating a dir for logs

Log_file_path=os.path.join(Log_path,Log_file_name)


## setting up basic configuration of the logging
logging.basicConfig(
    filename=Log_file_path,
    level=logging.INFO,
    format='[%(asctime)s] %(lineno)d-%(name)s-%(levelname)s-%(message)s'
)

logger = logging.getLogger("TransformerSummarizer")
