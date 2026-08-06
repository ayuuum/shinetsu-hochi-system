class MCheckpeople < ActiveRecord::Base
	belongs_to :m_kind
	belongs_to :m_pwd
  # attr_accessible :title, :body
#  attr_accessible :tenkentantoshaCode,
#                  :tenkentantoshamei,
#                  :tenkentantoshashubetuKbn,
#                  :tenkentantoshashubetu,
#                  :sakujyoFlg
# end
  private
    def m_checkpeople_params
      params.require(:m_checkpeople).permit(	:tenkentantoshaCode, 
											:tenkentantoshamei,
											:tenkentantoshashubetuKbn,
											:tenkentantoshashubetu,
											:sakujyoFlg)
    end
end
