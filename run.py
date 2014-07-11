#********************************************************************************
#--------------------------------------------------------------------------------
#
#	Significance Labs
#	Brooklyn, NYC
#
# 	Author: Alexandra Berke (aberke)
# 	Written: June 2014
#
#
#--------------------------------------------------------------------------------
#*********************************************************************************


from app import app


###### Run! ######
if __name__ == '__main__':
	app.run(host=app.config['HOST'], port=app.config['PORT'], debug=True) # Production doesn't use this file