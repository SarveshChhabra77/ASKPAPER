import sys


class AskPaperException(Exception):
    def __init__(self,error_message,error_details:sys):
        
        super().__init__(error_message)
        self.error_message = error_message
        _,_,_exc_db = error_details.exc_info()
        
        self.file_name=_exc_db.tb_frame.f_code.co_filename
        self.line_no=_exc_db.tb_lineno
        
    def __str__(self):
        return "An error occurred on line {0} of '{1}': {2}".format(self.line_no, self.file_name, self.error_message)