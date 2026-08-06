class THousinginfo < ActiveRecord::Base
	#has_and_belongs_to_many :m_orderingpatry
	has_many :m_orderingpatry
	has_many :t_check_info
	has_many :t_chktrackrec, :through => :t_check_info
	belongs_to :m_housinginfo
end
