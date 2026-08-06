class MKind < ActiveRecord::Base
	has_many :m_checkpeople
	has_many :t_check_info
	has_many :t_chktrackrec_info, :through => :t_check_info
  # attr_accessible :title, :body
#end

end
