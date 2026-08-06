class MPwd < ActiveRecord::Base
  # attr_accessible :title, :body
	#devise :database_authenticatable, :registerable,
    #     :recoverable, :rememberable, :trackable, :validatable, :authentication_keys => [:login]
         
	has_one :m_checkpeople
		
#end
 	private
		def m_pwd_params
		params.require(:m_pwd).permit(:uid, 
										  :upass,
										  :tenkentantoshaCode,
										  :urole)
	end

#	def self.find_first_by_auth_conditions(warden_conditions)
#    	conditions = warden_conditions.dup
#    	if login = conditions.delete(:login)
#    		where(conditions).where(["username = :value", { :value => username }]).first
#    	else
#			where(conditions).first
#    	end
#	end


end
